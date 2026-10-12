import { ChangeSet, EditorSelection } from '@codemirror/state'

function insertText(view, text, selectionFrom = text.length, selectionTo = selectionFrom) {
  const { from, to } = view.state.selection.main
  view.dispatch({
    changes: { from, to, insert: text },
    selection: {
      anchor: from + selectionFrom,
      head: from + selectionTo,
    },
    scrollIntoView: true,
  })
  view.focus()
}

function wrapSelection(view, before, after = before, placeholderText = '') {
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to)
  const content = selected || placeholderText
  const insertion = `${before}${content}${after}`
  const selectionStart = from + before.length
  const selectionEnd = selectionStart + content.length
  const selection = content
    ? EditorSelection.range(selectionStart, selectionEnd)
    : EditorSelection.cursor(selectionStart)

  view.dispatch({
    changes: { from, to, insert: insertion },
    selection,
    scrollIntoView: true,
  })
  view.focus()
}

function wrapLink(view, image = false, placeholderText) {
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to)
  const label = selected || placeholderText || (image ? 'image description' : 'link text')
  const prefix = image ? '![' : '['
  const insertion = `${prefix}${label}](https://)`
  const urlStart = from + prefix.length + label.length + 2

  view.dispatch({
    changes: { from, to, insert: insertion },
    selection: { anchor: urlStart, head: urlStart + 8 },
    scrollIntoView: true,
  })
  view.focus()
}

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

    // Change only the differing middle so CodeMirror can map the original caret accurately.
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

function applyBlockFormat(view, format) {
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

function insertBlock(view, content) {
  const { from, to } = view.state.selection.main
  const before = from > 0 && view.state.sliceDoc(from - 1, from) !== '\n' ? '\n' : ''
  const after = to < view.state.doc.length && view.state.sliceDoc(to, to + 1) !== '\n' ? '\n' : ''
  const insertion = `${before}${content}${after}`
  const cursor = from + before.length + content.length
  view.dispatch({
    changes: { from, to, insert: insertion },
    selection: { anchor: cursor },
    scrollIntoView: true,
  })
  view.focus()
}

export function insertBlockWithSelection(view, content, selectionStart, selectionEnd = selectionStart) {
  const { from, to } = view.state.selection.main
  const before = from > 0 && view.state.sliceDoc(from - 1, from) !== '\n' ? '\n' : ''
  const after = to < view.state.doc.length && view.state.sliceDoc(to, to + 1) !== '\n' ? '\n' : ''
  const insertion = `${before}${content}${after}`
  const start = from + before.length + selectionStart

  view.dispatch({
    changes: { from, to, insert: insertion },
    selection: { anchor: start, head: from + before.length + selectionEnd },
    scrollIntoView: true,
  })
  view.focus()
}

export function runToolbarAction(view, action) {
  if (!view) return

  switch (action) {
    case 'bold': wrapSelection(view, '**'); break
    case 'italic': wrapSelection(view, '*'); break
    case 'strike': wrapSelection(view, '~~'); break
    case 'highlight': wrapSelection(view, '==', '==', 'highlighted text'); break
    case 'inline-code': wrapSelection(view, '`'); break
    case 'link': wrapLink(view); break
    case 'image': wrapLink(view, true); break
    case 'heading1':
    case 'heading2':
    case 'heading3':
    case 'heading4':
    case 'heading5':
    case 'heading6':
    case 'bullet':
    case 'numbered':
    case 'task':
    case 'quote': applyBlockFormat(view, action); break
    case 'code-block': insertBlockWithSelection(view, '```text\ncode\n```', 8, 12); break
    case 'table': insertBlock(view, '| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |'); break
    case 'rule': insertBlock(view, '---'); break
    case 'footnote-ref': wrapSelection(view, '[^', ']', '1'); break
    case 'footnote-def': insertBlock(view, '[^1]: Footnote text'); break
    case 'math-inline': wrapSelection(view, '$', '$', 'x^2'); break
    case 'math-block': insertBlockWithSelection(view, '$$\n\\text{equation}\n$$', 3, 18); break
    case 'subscript': wrapSelection(view, '~', '~', 'subscript'); break
    case 'superscript': wrapSelection(view, '^', '^', 'superscript'); break
    case 'wiki-link': wrapSelection(view, '[[', ']]', 'Note title'); break
    case 'hashtag': insertText(view, '#tag', 1, 4); break
    case 'callout': insertBlock(view, '> [!NOTE]\n> Your note here'); break
    case 'mermaid': insertBlock(view, '```mermaid\ngraph TD\n  A[Start] --> B[Next step]\n```'); break
    case 'emoji': insertText(view, ':smile:', 1, 6); break
    case 'frontmatter': insertBlock(view, '---\ntitle: Untitled\ntags: []\n---'); break
    case 'file-embed': wrapLink(view, false, 'Open attachment'); break
    default: break
  }
}
