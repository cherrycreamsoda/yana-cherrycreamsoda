/**
 * Inserts regular links, images, wiki-links, and the file-embed Markdown
 * placeholder. MarkdownSourceEditing places and selects the URL or label;
 * MarkdownRenderer and InlineWidgets control link display and safety, while
 * Attachments owns actual local-file selection and storage.
 */
import { wrapLink, wrapSelection } from './MarkdownSourceEditing.js'

export function applyLinkFormatting(view, action) {
  switch (action) {
    case 'link': wrapLink(view); break
    case 'image': wrapLink(view, true); break
    case 'wiki-link': wrapSelection(view, '[[', ']]', 'Note title'); break
    case 'file-embed': wrapLink(view, false, 'Open attachment'); break
    default: return false
  }
  return true
}
