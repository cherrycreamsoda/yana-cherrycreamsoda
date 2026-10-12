import MarkdownIt from 'markdown-it'
import { full as markdownItEmoji } from 'markdown-it-emoji'
import markdownItMark from 'markdown-it-mark'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItTaskLists from 'markdown-it-task-lists'
import markdownItTexmath from 'markdown-it-texmath'
import katex from 'katex'

function isSafeMarkdownLink(url) {
  return /^(?:(?:https?|mailto|tel):|\/|\.\/|\.\.\/|#|yana-attachment:)/i.test(url.trim())
}

export const markdownRenderer = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  typographer: false,
  validateLink: isSafeMarkdownLink,
}).use(markdownItEmoji)
  .use(markdownItMark)
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItTaskLists, { label: true })
  .use(markdownItTexmath, { engine: katex, delimiters: 'dollars', katexOptions: { trust: false } })

// Footnotes use small local rules so their Markdown source remains untouched.
markdownRenderer.block.ruler.before('paragraph', 'yana_footnote_definition', (state, startLine, endLine, silent) => {
  const start = state.bMarks[startLine] + state.tShift[startLine]
  const end = state.eMarks[startLine]
  const match = state.src.slice(start, end).match(/^\[\^([\w-]+)\]:\s*(.*)$/)
  if (!match) return false
  if (silent) return true

  const token = state.push('yana_footnote_definition', '', 0)
  token.block = true
  token.map = [startLine, startLine + 1]
  token.meta = { id: match[1], content: match[2] }
  state.line = startLine + 1
  return true
})

markdownRenderer.renderer.rules.yana_footnote_definition = (tokens, index) => {
  const { id, content } = tokens[index].meta
  return `<div class="md-yana-footnote-definition" id="yana-footnote-${id}"><sup>${id}</sup> ${markdownRenderer.renderInline(content)}</div>`
}

markdownRenderer.inline.ruler.before('link', 'yana_footnote_reference', (state, silent) => {
  const match = state.src.slice(state.pos).match(/^\[\^([\w-]+)\]/)
  if (!match) return false
  if (!silent) {
    const token = state.push('yana_footnote_reference', '', 0)
    token.meta = { id: match[1] }
  }
  state.pos += match[0].length
  return true
})

markdownRenderer.renderer.rules.yana_footnote_reference = (tokens, index) => {
  const id = tokens[index].meta.id
  return `<a class="md-yana-footnote-reference" href="#yana-footnote-${id}"><sup>${id}</sup></a>`
}

const renderFence = markdownRenderer.renderer.rules.fence
markdownRenderer.renderer.rules.fence = (tokens, index, options, env, self) => {
  const token = tokens[index]
  if (token.info.trim().toLowerCase() === 'mermaid') {
    const escaped = markdownRenderer.utils.escapeHtml(token.content)
    return `<div class="cm-yana-mermaid" role="img" aria-label="Mermaid diagram">${escaped}</div>`
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

markdownRenderer.inline.ruler.before('link', 'yana_wiki_link', (state, silent) => {
  const match = state.src.slice(state.pos).match(/^\[\[([^\]\n]+)\]\]/)
  if (!match) return false
  if (!silent) {
    const token = state.push('yana_wiki_link', 'span', 0)
    token.attrSet('class', 'md-yana-wiki-link')
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
    token.attrSet('class', 'md-yana-hashtag')
    token.content = match[1]
  }
  state.pos += match[0].length
  return true
})

markdownRenderer.core.ruler.after('inline', 'yana_callout', (state) => {
  for (let index = 0; index < state.tokens.length; index += 1) {
    if (state.tokens[index].type !== 'blockquote_open') continue
    const inlineToken = state.tokens.slice(index + 1).find((token) => token.type === 'inline')
    const callout = inlineToken?.content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i)
    if (!callout) continue
    const kind = callout[1].toLowerCase()
    state.tokens[index].attrJoin('class', `md-yana-callout md-yana-callout-${kind}`)
    inlineToken.content = inlineToken.content.slice(callout[0].length)
    const textToken = inlineToken.children?.find((token) => token.type === 'text')
    if (textToken) textToken.content = textToken.content.replace(/^\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '')
  }
})
