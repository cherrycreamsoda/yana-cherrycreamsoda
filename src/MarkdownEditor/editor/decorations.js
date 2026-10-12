import { StateEffect } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin } from '@codemirror/view'
import { StateField } from '@codemirror/state'
import { HighlightStyle, ensureSyntaxTree, syntaxTree } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { parse as parseYaml } from 'yaml'
import { emojiShortcodes } from '../markdown/emoji.js'
import { buildRenderedMarkdown, EmojiWidget, ImageWidget, InlineLinkWidget, MathWidget, SubSupWidget, TaskMarkerWidget } from './widgets.js'
import { tableSourceEnterEffect, tableSourceModeEffect } from './tableMode.js'

const renderedMarkdownFocusEffect = StateEffect.define()

// Block replacements must come from a StateField, not a ViewPlugin decoration set.
export const renderedMarkdownField = StateField.define({
  create(state) {
    return {
      ...buildRenderedMarkdown(state, false, null),
      sourceTable: null,
      sourceTablePendingEnter: false,
    }
  },
  update(value, transaction) {
    let focused = value.focused
    let sourceTable = value.sourceTable
    let sourceTablePendingEnter = value.sourceTablePendingEnter
    let activatingSourceTable = false
    for (const effect of transaction.effects) {
      if (effect.is(renderedMarkdownFocusEffect)) focused = effect.value
      if (effect.is(tableSourceModeEffect)) {
        sourceTable = effect.value
        sourceTablePendingEnter = false
        activatingSourceTable = Boolean(effect.value)
      }
      if (effect.is(tableSourceEnterEffect)) sourceTablePendingEnter = true
    }
    if (transaction.docChanged && sourceTable) {
      sourceTable = {
        from: transaction.changes.mapPos(sourceTable.from, -1),
        to: transaction.changes.mapPos(sourceTable.to, -1),
      }
    }
    if (!focused && !activatingSourceTable) {
      sourceTable = null
      sourceTablePendingEnter = false
    }
    if (sourceTable && transaction.selectionSet) {
      const selectionInsideTable = transaction.state.selection.ranges.some(
        (range) => range.empty
          ? range.from >= sourceTable.from && range.from <= sourceTable.to
          : range.from >= sourceTable.from && range.to <= sourceTable.to,
      )
      const enteredBlankLineBelowTable = sourceTablePendingEnter
        && transaction.effects.some((effect) => effect.is(tableSourceEnterEffect))
        && transaction.state.selection.main.empty
        && transaction.state.selection.main.head === sourceTable.to + 1
        && transaction.state.doc.lineAt(sourceTable.to + 1).text === ''
      if (!selectionInsideTable && !enteredBlankLineBelowTable) {
        sourceTable = null
        sourceTablePendingEnter = false
      }
    }
    if (transaction.docChanged || transaction.selectionSet || focused !== value.focused) {
      return {
        ...buildRenderedMarkdown(transaction.state, focused, sourceTable),
        sourceTable,
        sourceTablePendingEnter,
      }
    }
    return sourceTable === value.sourceTable
      && sourceTablePendingEnter === value.sourceTablePendingEnter ? value : {
      ...buildRenderedMarkdown(transaction.state, focused, sourceTable),
      sourceTable,
      sourceTablePendingEnter,
    }
  },
  provide: (field) => EditorView.decorations.from(field, (value) => value.decorations),
})

export const focusTracker = ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view
    this.focused = view.hasFocus
    this.destroyed = false
  }

  update(update) {
    if (!update.focusChanged || this.focused === update.view.hasFocus) return
    this.focused = update.view.hasFocus
    const focused = this.focused
    queueMicrotask(() => {
      if (!this.destroyed && this.view.hasFocus === focused) {
        this.view.dispatch({ effects: renderedMarkdownFocusEffect.of(focused) })
      }
    })
  }

  destroy() {
    this.destroyed = true
  }
})

function addWidget(decorations, from, to, widget, block = false) {
  decorations.push(Decoration.replace({ widget, block }).range(from, to))
}

export const yanaSyntax = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = decorateYanaSyntax(view)
  }

  update(update) {
    if (update.docChanged || update.viewportChanged || update.selectionSet || update.focusChanged) {
      this.decorations = decorateYanaSyntax(update.view)
    }
  }
}, {
  decorations: (plugin) => plugin.decorations,
})

export const markdownStyles = HighlightStyle.define([
  { tag: tags.heading1, color: 'var(--color-text)', fontSize: '1.7em', fontWeight: '700' },
  { tag: tags.heading2, color: 'var(--color-text)', fontSize: '1.42em', fontWeight: '650' },
  { tag: tags.heading3, color: 'var(--color-text)', fontSize: '1.2em', fontWeight: '650' },
  { tag: tags.heading, color: 'var(--color-text)', fontWeight: '600' },
  { tag: tags.strong, color: 'var(--color-text)', fontWeight: '700' },
  { tag: tags.emphasis, color: 'var(--color-text)', fontStyle: 'italic' },
  { tag: tags.strikethrough, color: 'var(--color-muted)', textDecoration: 'line-through' },
  { tag: tags.link, color: 'var(--color-accent)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--color-accent)' },
  { tag: tags.monospace, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' },
  { tag: tags.quote, color: 'var(--color-muted)', fontStyle: 'italic' },
  { tag: tags.contentSeparator, color: 'var(--color-faint)' },
  { tag: tags.processingInstruction, color: 'var(--color-muted)' },
])

function decorateYanaSyntax(view) {
  const decorations = []
  const visibleEnd = view.visibleRanges.at(-1)?.to ?? 0
  const tree = ensureSyntaxTree(view.state, visibleEnd, 100) ?? syntaxTree(view.state)
  const renderedBlocks = view.state.field(renderedMarkdownField).ranges
  const documentText = view.state.sliceDoc()
  const frontmatter = documentText.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  const cursorTouches = (from, to) => view.hasFocus && view.state.selection.ranges.some(
    (selection) => selection.from <= to && selection.to >= from,
  )
  const isRenderedBlock = (from, to) => renderedBlocks.some(
    (block) => from >= block.from && to <= block.to,
  )

  const addMatches = (text, offset, codeRanges, pattern, className, widgetFactory) => {
    for (const match of text.matchAll(pattern)) {
      const from = offset + match.index
      const to = from + match[0].length
      const isCode = codeRanges.some((range) => from < range.to && to > range.from)
      if (isCode || isRenderedBlock(from, to)) continue
      if (widgetFactory && !cursorTouches(from, to)) {
        const widget = widgetFactory(match)
        if (widget) addWidget(decorations, from, to, widget)
        else decorations.push(Decoration.mark({ class: className }).range(from, to))
      } else {
        decorations.push(Decoration.mark({ class: className }).range(from, to))
      }
    }
  }

  for (const visibleRange of view.visibleRanges) {
    const { from, to } = visibleRange
    const text = view.state.sliceDoc(from, to)
    const codeRanges = []
    const imageWidgets = []
    const linkWidgets = []
    const taskWidgets = []
    tree.iterate({
      from,
      to,
      enter(node) {
        if (isRenderedBlock(node.from, node.to)) return
        if (['CodeBlock', 'FencedCode', 'InlineCode'].includes(node.name)) {
          codeRanges.push({ from: node.from, to: node.to })
        }

        if (node.name === 'Image') {
          const source = view.state.sliceDoc(node.from, node.to)
          const image = source.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+["'](.*?)["'])?\)$/)
          if (image && !cursorTouches(node.from, node.to)) {
            imageWidgets.push({
              from: node.from,
              to: node.to,
              widget: new ImageWidget(image[2], image[1], image[3] ?? ''),
            })
          }
        }

        if (node.name === 'Link') {
          const source = view.state.sliceDoc(node.from, node.to)
          if (
            !cursorTouches(node.from, node.to)
            && !source.includes('\n')
            && !codeRanges.some((range) => node.from < range.to && node.to > range.from)
          ) {
            linkWidgets.push({
              from: node.from,
              to: node.to,
              widget: new InlineLinkWidget(source),
            })
          }
        }

        if (node.name === 'TaskMarker') {
          const line = view.state.doc.lineAt(node.from)
          const marker = line.text.match(/^([ \t]*)(?:[-*+]|\d+[.)])[ \t]+\[([ xX])\]/)
          if (!marker) return
          taskWidgets.push({
            from: line.from + marker[1].length,
            to: line.from + marker[0].length,
            widget: new TaskMarkerWidget(/[xX]/.test(marker[2])),
          })
        }

        if (!['StrongEmphasis', 'Emphasis', 'Strikethrough', 'InlineCode'].includes(node.name)) {
          return
        }

        if (cursorTouches(node.from, node.to)) return

        const source = view.state.sliceDoc(node.from, node.to)
        const delimiter = node.name === 'StrongEmphasis'
          ? source.startsWith('**') || source.startsWith('__') ? 2 : 0
          : node.name === 'Strikethrough'
            ? source.startsWith('~~') ? 2 : 0
            : node.name === 'InlineCode'
              ? source.match(/^`+/)?.[0].length ?? 0
              : source.startsWith('*') || source.startsWith('_') ? 1 : 0

        if (delimiter > 0 && node.to - node.from >= delimiter * 2) {
          if (node.name === 'InlineCode' && node.to - node.from > delimiter * 2) {
            decorations.push(
              Decoration.mark({ class: 'cm-yana-inline-code' }).range(
                node.from + delimiter,
                node.to - delimiter,
              ),
            )
          }
          decorations.push(
            Decoration.replace({}).range(node.from, node.from + delimiter),
            Decoration.replace({}).range(node.to - delimiter, node.to),
          )
        }
      },
    })

    for (const item of [...imageWidgets, ...linkWidgets, ...taskWidgets]) {
      addWidget(decorations, item.from, item.to, item.widget)
    }

    addMatches(text, from, codeRanges, /\[\[[^\]\n]+\]\]/g, 'cm-yana-wiki-link')
    addMatches(text, from, codeRanges, /(?<![\w#])#(?:[\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*|[\p{L}\p{N}_-]+(?:\s+[\p{L}\p{N}_-]+)+#)/gu, 'cm-yana-tag')
    addMatches(
      text,
      from,
      codeRanges,
      /\$\$[^\n]+?\$\$|\\\[[^\n]+?\\\]|(?<!\$)\$(?!\$)[^\n$]+(?<!\$)\$(?!\$)|\\\([^\n]+?\\\)/g,
      'cm-yana-math',
      (match) => {
        const block = match[0].startsWith('$$') || match[0].startsWith('\\[')
        const source = match[0].startsWith('$$') || match[0].startsWith('\\[')
          ? match[0].slice(2, -2).trim()
          : match[0].startsWith('\\(')
            ? match[0].slice(2, -2)
            : match[0].slice(1, -1)
        return new MathWidget(source, block)
      },
    )
    for (const match of text.matchAll(/==[^=\n]+==/g)) {
      const matchFrom = from + match.index
      const matchTo = matchFrom + match[0].length
      if (
        codeRanges.some((range) => matchFrom < range.to && matchTo > range.from)
        || isRenderedBlock(matchFrom, matchTo)
      ) continue

      if (cursorTouches(matchFrom, matchTo)) {
        decorations.push(
          Decoration.mark({ class: 'cm-yana-highlight' }).range(matchFrom, matchTo),
        )
        continue
      }

      decorations.push(
        Decoration.replace({}).range(matchFrom, matchFrom + 2),
        Decoration.mark({ class: 'cm-yana-highlight-rendered' }).range(matchFrom + 2, matchTo - 2),
        Decoration.replace({}).range(matchTo - 2, matchTo),
      )
    }
    addMatches(text, from, codeRanges, /(?<![\w~])~([^~\n]+)~(?!~)/g, 'cm-yana-sub-sup', (match) => new SubSupWidget(match[1], 'sub'))
    addMatches(text, from, codeRanges, /(?<![\w^])\^([^^\n]+)\^(?!\^)/g, 'cm-yana-sub-sup', (match) => new SubSupWidget(match[1], 'sup'))
    addMatches(text, from, codeRanges, /\[\^[\w-]+\]/g, 'cm-yana-footnote')
    addMatches(text, from, codeRanges, /:[a-zA-Z0-9_+-]+:/g, 'cm-yana-emoji', (match) => {
      return emojiShortcodes[match[0].slice(1, -1)] ? new EmojiWidget(match[0]) : null
    })
    addMatches(text, from, codeRanges, /^\s*>\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gim, 'cm-yana-callout')
    addMatches(text, from, codeRanges, /^```(?:mermaid|math)\b[^\n]*$/gim, 'cm-yana-special-fence')
  }

  if (frontmatter && cursorTouches(0, frontmatter[0].length)) {
    let className = 'cm-yana-frontmatter'
    let title = 'YAML frontmatter'
    try {
      parseYaml(frontmatter[1])
    } catch (error) {
      className += ' cm-yana-frontmatter-error'
      title = `Invalid YAML frontmatter: ${error.message}`
    }
    decorations.push(
      Decoration.mark({ class: className, attributes: { title } }).range(0, frontmatter[0].length),
    )
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to)
  return Decoration.set(decorations, true)
}
