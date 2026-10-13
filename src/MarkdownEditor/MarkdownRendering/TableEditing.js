/**
 * Owns Markdown-table source reveal, cell-range lookup, keyboard navigation,
 * row insertion, and the state effects that activate table source editing.
 * RenderedMarkdown uses these helpers for preview-cell interactions, while
 * EditorExtensions connects arrow, Tab, and Enter keys; rendered ranges are
 * passed in so this module does not depend on preview state.
 */
import { StateEffect } from '@codemirror/state'
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language'
import { markdownLanguage } from '@codemirror/lang-markdown'

export const tableSourceModeEffect = StateEffect.define()

export const tableSourceEnterEffect = StateEffect.define()

// SOURCE REVEAL AND CELL RANGES
// Shared by keyboard navigation and interactive rendered table cells.
export function revealTableSource(view, range, selection = {
  anchor: range.from,
  head: range.to,
}) {
  view.dispatch({
    effects: tableSourceModeEffect.of(range),
    selection,
    scrollIntoView: true,
  })
  view.focus()
}
export function getTableCellRanges(view, tableFrom, cellIndex) {
  const tree = markdownLanguage.parser.parse(view.state.doc.toString())
  let table = null
  const cells = []

  tree.iterate({
    enter(node) {
      if (node.name === 'Table' && node.from === tableFrom) {
        table = { from: node.from, to: node.to }
      } else if (
        node.name === 'TableCell'
        && table
        && node.from >= table.from
        && node.to <= table.to
      ) {
        cells.push({ from: node.from, to: node.to })
      }
    },
  })

  const cell = cells[cellIndex]
  return table && cell ? { table, cell } : null
}
// NAVIGATION BETWEEN PREVIEW AND MARKDOWN
// Arrow keys reveal a rendered table when the caret crosses its boundary;
// Tab/Shift-Tab move between source cells or append a row.
export function revealRenderedTableOnArrow(view, direction, renderedRanges) {
  const selection = view.state.selection.main
  if (!selection.empty) return false

  const tree = ensureSyntaxTree(view.state, view.state.doc.length, 200) ?? syntaxTree(view.state)
  let revealed = false

  tree.iterate({
    enter(node) {
      if (revealed || node.name !== 'Table') return
      const isRendered = renderedRanges.some(
        (range) => range.from === node.from && range.to === node.to,
      )
      if (!isRendered) return

      const firstLine = view.state.doc.lineAt(node.from)
      const lastLine = view.state.doc.lineAt(node.to)
      const cursorLine = view.state.doc.lineAt(selection.head)
      let position = null

      if (direction === 'ArrowDown' && cursorLine.number === firstLine.number - 1) {
        position = node.from
      } else if (direction === 'ArrowUp' && cursorLine.number === lastLine.number + 1) {
        position = node.to
      } else if (direction === 'ArrowRight' && selection.head === node.from) {
        position = node.from
      } else if (direction === 'ArrowLeft' && selection.head === node.to) {
        position = node.to
      }

      if (position === null) return
      view.dispatch({
        effects: tableSourceModeEffect.of({ from: node.from, to: node.to }),
        selection: { anchor: position },
        scrollIntoView: true,
      })
      view.focus()
      revealed = true
    },
  })

  return revealed
}

export function navigateTableCell(view, backwards = false) {
  const selection = view.state.selection.main

  const tree = ensureSyntaxTree(view.state, view.state.doc.length, 200) ?? syntaxTree(view.state)
  let table = null
  const cells = []
  const rows = []
  tree.iterate({
    enter(node) {
      if (node.name === 'Table' && selection.head >= node.from && selection.head <= node.to) {
        table = { from: node.from, to: node.to }
      } else if (node.name === 'TableCell') {
        cells.push({ from: node.from, to: node.to })
      } else if (node.name === 'TableRow') {
        rows.push({ from: node.from, to: node.to })
      }
    },
  })
  if (!table) return false

  const tableCells = cells.filter((cell) => cell.from >= table.from && cell.to <= table.to)
  const currentIndex = tableCells.findIndex(
    (cell) => selection.from >= cell.from && selection.to <= cell.to,
  )
  if (currentIndex < 0) return false

  const nextIndex = currentIndex + (backwards ? -1 : 1)
  if (nextIndex >= 0 && nextIndex < tableCells.length) {
    view.dispatch({
      selection: {
        anchor: tableCells[nextIndex].from,
        head: tableCells[nextIndex].to,
      },
    })
    return true
  }
  if (backwards) return true

  const tableRows = rows.filter((row) => row.from >= table.from && row.to <= table.to)
  const lastRow = tableRows.at(-1)
  const columnCount = lastRow
    ? tableCells.filter((cell) => cell.from >= lastRow.from && cell.to <= lastRow.to).length
    : tableCells.length
  if (!columnCount) return false

  const rowText = `| ${Array(columnCount).fill('Cell').join(' | ')} |`
  const prefix = table.to > 0 && view.state.sliceDoc(table.to - 1, table.to) !== '\n' ? '\n' : ''
  const insertAt = table.to
  const firstCell = insertAt + prefix.length + 2
  view.dispatch({
    changes: { from: insertAt, insert: `${prefix}${rowText}` },
    selection: { anchor: firstCell, head: firstCell + 'Cell'.length },
    scrollIntoView: true,
  })
  return true
}
