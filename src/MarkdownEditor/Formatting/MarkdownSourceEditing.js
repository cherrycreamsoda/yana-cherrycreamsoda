/**
 * Provides shared Markdown-source editing operations: inserting text or
 * blocks, wrapping selections, creating link templates, and preserving
 * cursor/selection positions. InlineTextFormatting, LinkFormatting,
 * MathFormatting, CodeBlockFormatting, ExtendedFormatting, and
 * AttachmentActions use these helpers; feature-specific actions and routing
 * stay in their own modules.
 */
import { EditorSelection } from '@codemirror/state'

// TEXT AND INLINE SELECTIONS
// Shared helpers create formatting wrappers and keep the intended source
// selection active after the transaction.
export function insertText(view, text, selectionFrom = text.length, selectionTo = selectionFrom) {
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

export function wrapSelection(view, before, after = before, placeholderText = '') {
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

export function wrapLink(view, image = false, placeholderText) {
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
// BLOCK INSERTIONS
// Keep inserted blocks separated from adjacent source and place the cursor at
// the end of the new Markdown unless a feature selects a template value.
export function insertBlock(view, content) {
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
