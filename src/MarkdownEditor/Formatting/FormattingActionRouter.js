/**
 * Routes the shared toolbar and keyboard-shortcut action names to the single
 * formatting command that owns each behavior. Inline, block, link, math,
 * code-block, and extended commands live in their named Formatting modules;
 * this file coordinates them without implementing source transformations.
 */
import { applyBlockFormat, insertHorizontalRule } from './BlockFormatting.js'
import { applyCodeBlockFormatting } from './CodeBlockFormatting.js'
import { applyExtendedFormatting } from './ExtendedFormatting.js'
import { applyInlineTextFormatting } from './InlineTextFormatting.js'
import { applyLinkFormatting } from './LinkFormatting.js'
import { applyMathFormatting } from './MathFormatting.js'
import { insertBlock } from './MarkdownSourceEditing.js'

export function runToolbarAction(view, action) {
  if (!view) return
  if (applyInlineTextFormatting(view, action)) return
  if (applyLinkFormatting(view, action)) return
  if (applyMathFormatting(view, action)) return
  if (applyCodeBlockFormatting(view, action)) return
  if (applyExtendedFormatting(view, action)) return
  if (/^heading[1-6]$/.test(action) || ['bullet', 'numbered', 'task', 'quote'].includes(action)) {
    applyBlockFormat(view, action)
    return
  }
  if (action === 'rule') {
    insertHorizontalRule(view)
    return
  }
  if (action === 'table') {
    insertBlock(view, '| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |')
  }
}
