/**
 * Applies visual treatments to editable Markdown source for emphasis, inline
 * code, links/images, task markers, wiki-links/tags, math, highlights,
 * sub/superscript, emoji, callouts, and special fences. These decorations hide
 * syntax only while the cursor is away; moving into it restores editable
 * source. CodeMirror's syntax tree provides source positions, unlike
 * MarkdownRenderer's HTML previews; InlineWidgets handles rendered inline
 * replacements and RenderedMarkdown handles whole-block previews.
 */
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language'
import { Decoration, ViewPlugin } from '@codemirror/view'
import { renderedMarkdownField } from './RenderedMarkdown.js'
import {
  EmojiWidget,
  ImageWidget,
  InlineLinkWidget,
  MathWidget,
  SubSupWidget,
  TaskMarkerWidget,
  addWidget as addDecorationWidget,
  emojiShortcodes,
} from './InlineWidgets.js'

function decorateYanaSyntax(view) {
  const decorations = []
  const visibleEnd = view.visibleRanges.at(-1)?.to ?? 0
  const tree = ensureSyntaxTree(view.state, visibleEnd, 100) ?? syntaxTree(view.state)
  const renderedBlocks = view.state.field(renderedMarkdownField).ranges
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
        if (widget) addDecorationWidget(decorations, from, to, widget)
        else decorations.push(Decoration.mark({ class: className }).range(from, to))
      } else {
        decorations.push(Decoration.mark({ class: className }).range(from, to))
      }
    }
  }

  // CODEMIRROR MARKDOWN NODES
  // Use parsed source positions for links, images, task markers, emphasis,
  // and code exclusions before scanning YANA-specific inline patterns.
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
              Decoration.mark({ class: 'cmYanaInlineCode' }).range(
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
      addDecorationWidget(decorations, item.from, item.to, item.widget)
    }

    // YANA INLINE FEATURES
    // These targeted patterns cover syntax not represented as a standard
    // Markdown node and defer rendering to their widget or stylesheet.
    addMatches(text, from, codeRanges, /\[\[[^\]\n]+\]\]/g, 'cmYanaWikiLink')

    addMatches(text, from, codeRanges, /(?<![\w#])#(?:[\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*|[\p{L}\p{N}_-]+(?:\s+[\p{L}\p{N}_-]+)+#)/gu, 'cmYanaTag')

    addMatches(
      text,
      from,
      codeRanges,
      /\$\$[^\n]+?\$\$|\\\[[^\n]+?\\\]|(?<!\$)\$(?!\$)[^\n$]+(?<!\$)\$(?!\$)|\\\([^\n]+?\\\)/g,
      'cmYanaMath',
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
          Decoration.mark({ class: 'cmYanaHighlight' }).range(matchFrom, matchTo),
        )
        continue
      }

      decorations.push(
        Decoration.replace({}).range(matchFrom, matchFrom + 2),
        Decoration.mark({ class: 'cmYanaHighlightRendered' }).range(matchFrom + 2, matchTo - 2),
        Decoration.replace({}).range(matchTo - 2, matchTo),
      )
    }

    addMatches(text, from, codeRanges, /(?<![\w~])~([^~\n]+)~(?!~)/g, 'cmYanaSubSup', (match) => new SubSupWidget(match[1], 'sub'))

    addMatches(text, from, codeRanges, /(?<![\w^])\^([^^\n]+)\^(?!\^)/g, 'cmYanaSubSup', (match) => new SubSupWidget(match[1], 'sup'))

    addMatches(text, from, codeRanges, /:[a-zA-Z0-9_+-]+:/g, 'cmYanaEmoji', (match) => {
      return emojiShortcodes[match[0].slice(1, -1)] ? new EmojiWidget(match[0]) : null
    })

    addMatches(text, from, codeRanges, /^\s*>\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gim, 'cmYanaCallout')
    addMatches(text, from, codeRanges, /^```(?:mermaid|math)\b[^\n]*$/gim, 'cmYanaSpecialFence')
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to)
  return Decoration.set(decorations, true)
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
