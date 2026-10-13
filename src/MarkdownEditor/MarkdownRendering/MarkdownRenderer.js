/**
 * Converts Markdown into safe preview HTML for rendered blocks and inline
 * link widgets. This Markdown-it renderer supports emoji, highlights,
 * subscript/superscript, math, wiki-links, hashtags, callouts, safe links, and
 * Mermaid fences. It is separate from CodeMirror's syntax tree, which tracks
 * source positions for editing; RenderedMarkdown and InlineWidgets use the
 * HTML produced here.
 */
import katex from 'katex'
import MarkdownIt from 'markdown-it'
import { full as markdownItEmoji } from 'markdown-it-emoji'
import markdownItMark from 'markdown-it-mark'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItTexmath from 'markdown-it-texmath'

function isSafeMarkdownLink(url) {
  return /^(?:(?:https?|mailto|tel):|\/|\.\/|\.\.\/|#|yana-attachment:)/i.test(url.trim())
}

// BASE RENDERER AND PLUGINS
// Markdown-it produces preview HTML; source-aware editing remains in
// CodeMirror's syntax-tree and decoration modules.
export const markdownRenderer = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  typographer: false,
  validateLink: isSafeMarkdownLink,
})
  .use(markdownItEmoji)
  .use(markdownItMark)
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItTexmath, { engine: katex, delimiters: 'dollars', katexOptions: { trust: false } })

const renderFence = markdownRenderer.renderer.rules.fence

// CUSTOM FENCE AND LINK OUTPUT
// Mermaid markup is escaped until the rendered-block widget securely renders
// it, and external HTTP links open with safe browsing attributes.
markdownRenderer.renderer.rules.fence = (tokens, index, options, env, self) => {
  const token = tokens[index]
  if (token.info.trim().toLowerCase() === 'mermaid') {
    const escaped = markdownRenderer.utils.escapeHtml(token.content)
    return `<div class="cmYanaMermaid" role="img" aria-label="Mermaid diagram">${escaped}</div>`
  }
  return renderFence(tokens, index, options, env, self)
}

markdownRenderer.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index]
  if (token.attrGet('href')?.match(/^https?:/i)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return self.renderToken(tokens, index, options)
}

// INLINE YANA SYNTAX
// These rules create preview tokens for wiki-links and hashtags; their
// editable-source counterparts live in InlineSyntaxDecorations.js.
markdownRenderer.inline.ruler.before('link', 'yana_wiki_link', (state, silent) => {
  const match = state.src.slice(state.pos).match(/^\[\[([^\]\n]+)\]\]/)
  if (!match) return false
  if (!silent) {
    const token = state.push('yana_wiki_link', 'span', 0)
    token.attrSet('class', 'mdYanaWikiLink')
    token.content = match[1]
    token.markup = '[['
  }
  state.pos += match[0].length
  return true
})

markdownRenderer.inline.ruler.before('link', 'yana_hashtag', (state, silent) => {
  const source = state.src.slice(state.pos)
  const match = source.match(/^#([\p{L}\p{N}_-]+(?:\s+[\p{L}\p{N}_-]+)+)#/u)
    ?? source.match(/^#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)(?![\w/])/u)
  if (!match || (state.pos > 0 && /[\w#]/u.test(state.src[state.pos - 1]))) return false
  if (!silent) {
    const token = state.push('yana_hashtag', 'span', 0)
    token.attrSet('class', 'mdYanaHashtag')
    token.content = match[1]
  }
  state.pos += match[0].length
  return true
})

// CALLOUT BLOCK TRANSFORMATION
// Convert the leading callout marker into presentation classes without
// changing the source document.
markdownRenderer.core.ruler.after('inline', 'yana_callout', (state) => {
  for (let index = 0; index < state.tokens.length; index += 1) {
    if (state.tokens[index].type !== 'blockquote_open') continue
    const inlineToken = state.tokens.slice(index + 1).find((token) => token.type === 'inline')
    const callout = inlineToken?.content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i)
    if (!callout) continue
    const kind = callout[1].toLowerCase()
    state.tokens[index].attrJoin('class', `mdYanaCallout mdYanaCallout${kind[0].toUpperCase()}${kind.slice(1)}`)
    inlineToken.content = inlineToken.content.slice(callout[0].length)
    const textToken = inlineToken.children?.find((token) => token.type === 'text')
    if (textToken) textToken.content = textToken.content.replace(/^\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '')
  }
})
