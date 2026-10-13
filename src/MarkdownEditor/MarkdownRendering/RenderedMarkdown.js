/**
 * Replaces eligible whole blocks with previews for tables, fenced/indented
 * code, HTML, horizontal rules, paired-line display math, Mermaid, and local
 * attachment images/links. Source returns when focused selection enters a
 * block. This module uses MarkdownRenderer for preview HTML, InlineWidgets for
 * math, RenderedMarkdownWidget for interactive blocks, and TableEditing for
 * table source-mode effects; CodeMirror's syntax tree supplies source ranges.
 */
import DOMPurify from 'dompurify'
import { markdownLanguage } from '@codemirror/lang-markdown'
import { StateField, StateEffect } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view'
import { loadAttachment } from '../Attachments/AttachmentStorage.js'
import { addWidget, MathWidget } from './InlineWidgets.js'
import { markdownRenderer } from './MarkdownRenderer.js'
import {
  getTableCellRanges,
  revealTableSource,
  tableSourceEnterEffect,
  tableSourceModeEffect,
} from './TableEditing.js'

let nextMermaidId = 0

// INTERACTIVE WHOLE-BLOCK WIDGET
// Sanitizes preview HTML, then connects tables, attachments, and Mermaid
// output to their source-backed interactions.
export class RenderedMarkdownWidget extends WidgetType {
  constructor(source, from, html, tableCellRanges = []) {
    super()
    this.source = source
    this.from = from
    this.html = html
    this.tableCellRanges = tableCellRanges
  }

  eq(other) {
    return other.source === this.source
      && other.from === this.from
  }

  toDOM(view) {
    const container = document.createElement('div')
    container.className = 'cmYanaRenderedBlock'
    container.innerHTML = DOMPurify.sanitize(this.html, {
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|\.\/|\.\.\/|#|yana-attachment:)/i,
    })
    for (const link of container.querySelectorAll('a[href]')) {
      if (!/^https?:/i.test(link.getAttribute('href'))) continue
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    }

    const renderedTable = container.querySelector('table')
    if (renderedTable) {
      const cells = renderedTable.querySelectorAll('th, td')
      cells.forEach((cell, index) => {
        const sourceRange = this.tableCellRanges[index]
        if (!sourceRange) return
        let dirty = false
        cell.contentEditable = 'true'
        cell.tabIndex = 0
        cell.setAttribute('role', 'textbox')
        cell.setAttribute('aria-label', `Table cell ${index + 1}`)
        cell.title = 'Click to edit; triple-click to edit Markdown'
        cell.addEventListener('input', () => {
          dirty = true
        })
        cell.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            cell.blur()
            return
          }
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return

          event.preventDefault()
          event.stopPropagation()
          cell.blur()

          const currentTable = getTableCellRanges(view, this.from, index)
          const cellSourceRange = currentTable?.cell ?? sourceRange
          const tableRange = currentTable?.table
            ?? { from: this.from, to: this.from + this.source.length }
          const position = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
            ? cellSourceRange.from
            : cellSourceRange.to
          revealTableSource(
            view,
            tableRange,
            { anchor: position },
          )
        })
        cell.addEventListener('blur', () => {
          if (!dirty) return
          dirty = false
          const nextValue = cell.innerText
            .replace(/[\r\n]+/g, ' ')
            .replace(/\\/g, '\\\\')
            .replace(/\|/g, '\\|')
          const previousValue = view.state.sliceDoc(sourceRange.from, sourceRange.to)
          if (nextValue === previousValue) return

          view.dispatch({
            changes: { from: sourceRange.from, to: sourceRange.to, insert: nextValue },
          })
        })
        cell.addEventListener('click', (event) => {
          if (event.detail < 3) return
          event.preventDefault()
          revealTableSource(view, { from: this.from, to: this.from + this.source.length })
        })
      })
      renderedTable.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return
        const activeCell = event.target.closest('th, td')
        const allCells = [...renderedTable.querySelectorAll('th, td')]
        const currentIndex = allCells.indexOf(activeCell)
        const nextIndex = currentIndex + (event.shiftKey ? -1 : 1)
        if (!allCells[nextIndex]) return
        event.preventDefault()
        activeCell.blur()
        requestAnimationFrame(() => {
          const currentCells = view.dom.querySelectorAll('.cmYanaRenderedBlock table th, .cmYanaRenderedBlock table td')
          currentCells[nextIndex]?.focus()
        })
      })
    }

    for (const image of container.querySelectorAll('img[src^="yana-attachment:"]')) {
      const id = image.getAttribute('src').slice('yana-attachment:'.length)
      void loadAttachment(id).then((attachment) => {
        if (!attachment) throw new Error('Attachment is missing from this device.')
        image.src = URL.createObjectURL(attachment.blob)
      }).catch(() => {
        image.replaceWith(document.createTextNode(`[Image unavailable: ${image.alt}]`))
      })
    }
    for (const link of container.querySelectorAll('a[href^="yana-attachment:"]')) {
      const id = link.getAttribute('href').slice('yana-attachment:'.length)
      link.addEventListener('click', async (event) => {
        event.preventDefault()
        try {
          const attachment = await loadAttachment(id)
          if (!attachment) throw new Error('Attachment is missing from this device.')
          const url = URL.createObjectURL(attachment.blob)
          const download = document.createElement('a')
          download.href = url
          download.download = attachment.name
          download.click()
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Unable to open the attachment.', error)
          link.title = error.message
        }
      })
    }

    for (const diagram of container.querySelectorAll('.cmYanaMermaid')) {
      const source = diagram.textContent ?? ''
      diagram.replaceChildren()
      diagram.textContent = 'Rendering diagram…'
      void import('mermaid').then(async ({ default: mermaid }) => {
        const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default'
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          suppressErrorRendering: true,
          theme,
          htmlLabels: false,
        })
        const result = await mermaid.render(`yana-mermaid-${++nextMermaidId}`, source)

        diagram.innerHTML = DOMPurify.sanitize(result.svg, { USE_PROFILES: { svg: true, svgFilters: true } })
      }).catch(() => {
        diagram.textContent = 'Diagram could not be rendered. Edit the Mermaid source to correct it.'
        diagram.classList.add('cmYanaMermaidError')
      })
    }

    container.addEventListener('click', (event) => {
      if (event.target.closest('a, input, button, th, td')) return
      view.dispatch({ selection: { anchor: this.from }, scrollIntoView: true })
      view.focus()
    })
    return container
  }

  ignoreEvent() {
    return true
  }

  destroy(dom) {
    for (const image of dom.querySelectorAll('img[src^="blob:"]')) {
      URL.revokeObjectURL(image.src)
    }
  }
}

// PREVIEW ELIGIBILITY AND SOURCE RANGES
// Build whole-block replacements only when the focused selection is outside
// the source and no table is explicitly in editing mode.
function buildRenderedMarkdown(state, focused, activeSourceTable) {
  const decorations = []
  const ranges = []
  const source = state.doc.toString()
  const selectionTouches = (from, to) => focused && state.selection.ranges.some(
    (selection) => selection.from < to && selection.to > from
      || selection.empty && selection.from >= from && selection.from <= to,
  )

  const tree = markdownLanguage.parser.parse(source)
  const codeRanges = []
  tree.iterate({
    enter(node) {
      if (node.name === 'CodeBlock' || node.name === 'FencedCode') {
        codeRanges.push({ from: node.from, to: node.to })
      }
    },
  })

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const openLine = state.doc.line(lineNumber)
    const opener = openLine.text.match(/^[ \t]*(\$\$|\\\[)[ \t]*$/)
    if (!opener || codeRanges.some((range) => openLine.from >= range.from && openLine.to <= range.to)) continue

    const closer = opener[1] === '$$' ? '$$' : '\\]'
    let closeLine = null
    for (let candidateNumber = lineNumber + 1; candidateNumber <= state.doc.lines; candidateNumber += 1) {
      const candidate = state.doc.line(candidateNumber)
      if (candidate.text.trim() === closer) {
        closeLine = candidate
        break
      }
    }
    if (!closeLine) continue

    if (!selectionTouches(openLine.from, closeLine.to)) {
      const mathSource = state.sliceDoc(openLine.to, closeLine.from).trim()
      ranges.push({ from: openLine.from, to: closeLine.to })
      addWidget(
        decorations,
        openLine.from,
        closeLine.to,
        new MathWidget(mathSource, true),
        true,
      )
    }
    lineNumber = closeLine.number
  }

  const linkDefinitions = [...source.matchAll(/^[ \t]{0,3}\[[^\]\n]+\]:[ \t]*\S+[^\n]*(?:\r?\n[ \t]+\S[^\n]*)?/gm)]
    .map((match) => match[0])

  const renderableBlocks = new Set([
    'Table',
    'FencedCode',
    'CodeBlock',
    'HTMLBlock',
    'HorizontalRule',
  ])

  for (let node = tree.topNode.firstChild; node; node = node.nextSibling) {
    if (!renderableBlocks.has(node.name)) continue
    if (node.name === 'Table' && activeSourceTable
      && activeSourceTable.from <= node.to && activeSourceTable.to >= node.from) continue
    if (ranges.some((range) => node.from >= range.from && node.to <= range.to)) continue
    if (selectionTouches(node.from, node.to)) continue
    const blockSource = state.sliceDoc(node.from, node.to)
    const renderSource = linkDefinitions.length
      ? `${blockSource}\n\n${linkDefinitions.join('\n')}`
      : blockSource
    const tableCellRanges = []
    if (node.name === 'Table') {
      tree.iterate({
        from: node.from,
        to: node.to,
        enter(child) {
          if (child.name === 'TableCell') {
            tableCellRanges.push({ from: child.from, to: child.to })
          }
        },
      })
    }
    ranges.push({ from: node.from, to: node.to })
    addWidget(
      decorations,
      node.from,
      node.to,
      new RenderedMarkdownWidget(
        blockSource,
        node.from,
        markdownRenderer.render(renderSource),
        tableCellRanges,
      ),
      true,
    )
  }

  return {
    decorations: Decoration.set(decorations, true),
    ranges,
    focused,
  }
}

const renderedMarkdownFocusEffect = StateEffect.define()

// PREVIEW STATE AND FOCUS TRACKING
// Keep preview ranges synchronized with document edits, selection, focus, and
// the table source-mode effects supplied by TableEditing.js.
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
