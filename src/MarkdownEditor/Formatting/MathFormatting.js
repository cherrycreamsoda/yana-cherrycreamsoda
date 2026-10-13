/**
 * Inserts inline math and display-math templates into the Markdown source.
 * InlineSyntaxDecorations recognizes inline math; RenderedMarkdown recognizes
 * paired-line display math. Both use InlineWidgets for KaTeX display, while
 * MarkdownRenderer's math plugin produces math inside rendered preview HTML.
 */
import { insertBlockWithSelection, wrapSelection } from './MarkdownSourceEditing.js'

export function applyMathFormatting(view, action) {
  if (action === 'math-inline') {
    wrapSelection(view, '$', '$', 'x^2')
    return true
  }
  if (action === 'math-block') {
    insertBlockWithSelection(view, '$$\n\\text{equation}\n$$', 3, 18)
    return true
  }
  return false
}
