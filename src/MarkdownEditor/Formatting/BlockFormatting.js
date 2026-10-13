/**
 * Changes selected lines into headings 1–6, bulleted/numbered/task lists, or
 * blockquotes, and inserts horizontal rules. It edits Markdown source through
 * shared line insertion helpers; InlineSyntaxDecorations displays task
 * checkboxes while the cursor is outside their source markers.
 */
import { ChangeSet, EditorSelection } from '@codemirror/state'
import { insertBlock } from './MarkdownSourceEditing.js'

function transformSelectedLines(view, transform) {
  const { state } = view
  const selection = state.selection
  const firstLine = state.doc.lineAt(selection.main.from)
  const lastLine = state.doc.lineAt(selection.main.to)
  const changes = []

  for (let number = firstLine.number; number <= lastLine.number; number += 1) {
    const line = state.doc.line(number)
    const formattedLine = transform(line.text, number - firstLine.number)
    if (formattedLine === line.text) continue

    let commonPrefix = 0
    while (
      commonPrefix < line.text.length
      && commonPrefix < formattedLine.length
      && line.text[commonPrefix] === formattedLine[commonPrefix]
    ) {
      commonPrefix += 1
    }

    let commonSuffix = 0
    while (
      commonSuffix < line.text.length - commonPrefix
      && commonSuffix < formattedLine.length - commonPrefix
      && line.text[line.text.length - commonSuffix - 1]
        === formattedLine[formattedLine.length - commonSuffix - 1]
    ) {
      commonSuffix += 1
    }

    changes.push({
      from: line.from + commonPrefix,
      to: line.to - commonSuffix,
      insert: formattedLine.slice(commonPrefix, formattedLine.length - commonSuffix),
    })
  }

  if (changes.length === 0) {
    view.focus()
    return
  }
  const changeSet = ChangeSet.of(changes, state.doc.length)
  view.dispatch({
    changes: changeSet,
    selection: EditorSelection.create(
      selection.ranges.map((range) => EditorSelection.range(
        changeSet.mapPos(range.anchor, 1),
        changeSet.mapPos(range.head, 1),
      )),
      selection.mainIndex,
    ),
    scrollIntoView: true,
  })
  view.focus()
}

// SELECTED-LINE FORMATTING
// Rewrites selected lines while mapping the user's selection to the same text.
export function applyBlockFormat(view, format) {

  const prefixFormat = (prefix) => transformSelectedLines(view, (line) => {
    const withoutExisting = line.replace(/^\s{0,3}(?:#{1,6}\s+|>\s?|- \[[ xX]\]\s+|[-*+]\s+|\d+[.)]\s+)+/, '')
    return `${prefix}${withoutExisting}`
  })

  if (format.startsWith('heading')) {
    const level = Number(format.slice(-1))
    const prefix = `${'#'.repeat(level)} `
    transformSelectedLines(view, (line) => `${line.replace(/^\s{0,3}#{1,6}\s+/, '')}`.replace(/^/, prefix))
  } else if (format === 'bullet') {
    prefixFormat('- ')
  } else if (format === 'numbered') {
    transformSelectedLines(view, (line, index) => `${index + 1}. ${line.replace(/^\s{0,3}(?:- \[[ xX]\]\s+|[-*+]\s+|\d+[.)]\s+)/, '')}`)
  } else if (format === 'task') {
    transformSelectedLines(view, (line) => `- [ ] ${line.replace(/^\s{0,3}(?:- \[[ xX]\]\s+|[-*+]\s+|\d+[.)]\s+)/, '')}`)
  } else if (format === 'quote') {
    transformSelectedLines(view, (line) => `> ${line.replace(/^\s{0,3}>\s?/, '')}`)
  }
}
export function insertHorizontalRule(view) {
  insertBlock(view, '---')
}
