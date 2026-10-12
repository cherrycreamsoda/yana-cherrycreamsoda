import { ensureSyntaxTree, syntaxTree } from '@codemirror/language'

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

  // Tab from the last cell creates a row matching the table's existing column count.
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
