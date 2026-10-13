/**
 * Inserts fenced-code and Mermaid-diagram templates into Markdown source.
 * RenderedMarkdown previews code blocks, and MarkdownRenderer turns Mermaid
 * fences into diagram placeholders for safe rendering by the block widget.
 */
import { insertBlock, insertBlockWithSelection } from './MarkdownSourceEditing.js'

export function applyCodeBlockFormatting(view, action) {
  if (action === 'code-block') {
    insertBlockWithSelection(view, '```text\ncode\n```', 8, 12)
    return true
  }
  if (action === 'mermaid') {
    insertBlock(view, '```mermaid\ngraph TD\n  A[Start] --> B[Next step]\n```')
    return true
  }
  return false
}
