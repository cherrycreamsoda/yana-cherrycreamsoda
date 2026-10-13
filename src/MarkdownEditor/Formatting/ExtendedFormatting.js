/**
 * Inserts subscript, superscript, hashtag, callout, and emoji-shortcode
 * Markdown. InlineSyntaxDecorations and MarkdownRenderer provide their visual
 * forms; hashtag insertion is owned here, while local attachment storage is
 * handled separately by the Attachments modules.
 */
import { insertBlock, insertText, wrapSelection } from './MarkdownSourceEditing.js'

export function applyExtendedFormatting(view, action) {
  switch (action) {
    case 'subscript': wrapSelection(view, '~', '~', 'subscript'); break
    case 'superscript': wrapSelection(view, '^', '^', 'superscript'); break
    case 'hashtag': insertText(view, '#tag', 1, 4); break
    case 'callout': insertBlock(view, '> [!NOTE]\n> Your note here'); break
    case 'emoji': insertText(view, ':smile:', 1, 6); break
    default: return false
  }
  return true
}
