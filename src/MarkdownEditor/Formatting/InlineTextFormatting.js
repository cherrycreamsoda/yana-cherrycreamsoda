/**
 * Inserts bold, italic, strikethrough, highlighted text, and inline-code
 * Markdown around the current selection. MarkdownSourceEditing preserves the
 * selected text and cursor; InlineSyntaxDecorations controls its editable
 * appearance without changing the stored Markdown.
 */
import { wrapSelection } from './MarkdownSourceEditing.js'

export function applyInlineTextFormatting(view, action) {
  switch (action) {
    case 'bold': wrapSelection(view, '**'); break
    case 'italic': wrapSelection(view, '*'); break
    case 'strike': wrapSelection(view, '~~'); break
    case 'highlight': wrapSelection(view, '==', '==', 'highlighted text'); break
    case 'inline-code': wrapSelection(view, '`'); break
    default: return false
  }
  return true
}
