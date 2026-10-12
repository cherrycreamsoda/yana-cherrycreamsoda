import DOMPurify from 'dompurify'
import katex from 'katex'
import { WidgetType, Decoration } from '@codemirror/view'
import { markdownLanguage } from '@codemirror/lang-markdown'
import { parse as parseYaml } from 'yaml'
import { markdownRenderer } from '../markdown/renderer.js'
import { emojiShortcodes } from '../markdown/emoji.js'
import { loadAttachment } from '../attachments/storage.js'
import { revealTableSource } from './tableMode.js'

let nextMermaidId = 0

function addWidget(decorations, from, to, widget, block = false) {
  decorations.push(Decoration.replace({ widget, block }).range(from, to))
}

function isSafeResourceUrl(value) {
  const url = value.trim()
  if (/^(?:https?:|mailto:|tel:|\/|\.\/|\.\.\/|#)/i.test(url)) return true
  return /^yana-attachment:[\w-]+$/i.test(url)
}

export class MathWidget extends WidgetType {
  constructor(source, display = false) {
    super()
    this.source = source
    this.display = display
  }

  eq(other) {
    return other.source === this.source && other.display === this.display
  }

  toDOM() {
    const element = document.createElement(this.display ? 'div' : 'span')
    element.className = this.display ? 'cm-yana-rendered-math cm-yana-display-math' : 'cm-yana-rendered-math'
    try {
      element.innerHTML = katex.renderToString(this.source, {
        displayMode: this.display,
        throwOnError: false,
        strict: 'warn',
        trust: false,
      })
    } catch (error) {
      element.textContent = this.source
      element.title = `Math could not be rendered: ${error.message}`
    }
    return element
  }

  ignoreEvent() {
    return true
  }
}

export class InlineLinkWidget extends WidgetType {
  constructor(source) {
    super()
    this.source = source
  }

  eq(other) {
    return other.source === this.source
  }

  toDOM() {
    const element = document.createElement('span')
    element.className = 'cm-yana-inline-link-widget'
    element.innerHTML = DOMPurify.sanitize(markdownRenderer.renderInline(this.source), {
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|\.\/|\.\.\/|#|yana-attachment:)/i,
    })
    for (const link of element.querySelectorAll('a[href]')) {
      if (!/^https?:/i.test(link.getAttribute('href'))) continue
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    }
    return element
  }

  ignoreEvent() {
    return true
  }
}

export class EmojiWidget extends WidgetType {
  constructor(shortcode) {
    super()
    this.shortcode = shortcode
    this.emoji = emojiShortcodes[shortcode.slice(1, -1)] ?? this.shortcode
  }

  eq(other) {
    return other.shortcode === this.shortcode
  }

  toDOM() {
    const element = document.createElement('span')
    element.className = 'cm-yana-rendered-emoji'
    element.textContent = this.emoji
    element.title = this.shortcode
    return element
  }
}

export class ImageWidget extends WidgetType {
  constructor(source, alt, title) {
    super()
    this.source = source
    this.alt = alt
    this.title = title
  }

  eq(other) {
    return other.source === this.source && other.alt === this.alt && other.title === this.title
  }

  toDOM() {
    const wrapper = document.createElement('span')
    wrapper.className = this.source.startsWith('yana-attachment:')
      ? 'cm-yana-image-widget cm-yana-image-attachment'
      : 'cm-yana-image-widget'
    if (!isSafeResourceUrl(this.source)) {
      wrapper.textContent = `[Image blocked: ${this.alt}]`
      wrapper.title = 'Only relative, HTTP, and HTTPS image URLs are allowed.'
      return wrapper
    }

    const image = document.createElement('img')
    image.alt = this.alt
    image.loading = 'lazy'
    image.referrerPolicy = 'no-referrer'
    if (this.title) image.title = this.title
    if (this.source.startsWith('yana-attachment:')) {
      const id = this.source.slice('yana-attachment:'.length)
      void loadAttachment(id).then((attachment) => {
        if (!attachment) throw new Error('Attachment is missing from this device.')
        image.src = URL.createObjectURL(attachment.blob)
      }).catch((error) => {
        wrapper.textContent = `[Image unavailable: ${this.alt}]`
        wrapper.title = error.message
      })
    } else {
      image.src = this.source
    }
    image.addEventListener('error', () => {
      wrapper.textContent = `[Image unavailable: ${this.alt}]`
    }, { once: true })
    wrapper.append(image)
    return wrapper
  }

  destroy(dom) {
    const image = dom.querySelector('img')
    if (image?.src.startsWith('blob:')) URL.revokeObjectURL(image.src)
  }
}

export class RenderedMarkdownWidget extends WidgetType {
  constructor(source, from, html, tableCellRanges = []) {
    super()
    this.source = source
    this.from = from
    this.html = html
    this.tableCellRanges = tableCellRanges
  }

  eq(other) {
    return other.source === this.source
      && other.from === this.from
  }

  toDOM(view) {
    const container = document.createElement('div')
    container.className = 'cm-yana-rendered-block'
    container.innerHTML = DOMPurify.sanitize(this.html, {
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|\.\/|\.\.\/|#|yana-attachment:)/i,
    })
    for (const link of container.querySelectorAll('a[href]')) {
      if (!/^https?:/i.test(link.getAttribute('href'))) continue
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    }
    const renderedTable = container.querySelector('table')
    if (renderedTable) {
      const cells = renderedTable.querySelectorAll('th, td')
      cells.forEach((cell, index) => {
        const sourceRange = this.tableCellRanges[index]
        if (!sourceRange) return
        let dirty = false
        cell.contentEditable = 'true'
        cell.tabIndex = 0
        cell.setAttribute('role', 'textbox')
        cell.setAttribute('aria-label', `Table cell ${index + 1}`)
        cell.title = 'Click to edit; triple-click to edit Markdown'
        cell.addEventListener('input', () => {
          dirty = true
        })
        cell.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            cell.blur()
          }
        })
        cell.addEventListener('blur', () => {
          if (!dirty) return
          dirty = false
          const nextValue = cell.innerText
            .replace(/[\r\n]+/g, ' ')
            .replace(/\\/g, '\\\\')
            .replace(/\|/g, '\\|')
          const previousValue = view.state.sliceDoc(sourceRange.from, sourceRange.to)
          if (nextValue === previousValue) return
          view.dispatch({
            changes: { from: sourceRange.from, to: sourceRange.to, insert: nextValue },
          })
        })
        cell.addEventListener('click', (event) => {
          if (event.detail < 3) return
          event.preventDefault()
          revealTableSource(view, { from: this.from, to: this.from + this.source.length })
        })
      })
      renderedTable.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return
        const activeCell = event.target.closest('th, td')
        const allCells = [...renderedTable.querySelectorAll('th, td')]
        const currentIndex = allCells.indexOf(activeCell)
        const nextIndex = currentIndex + (event.shiftKey ? -1 : 1)
        if (!allCells[nextIndex]) return
        event.preventDefault()
        activeCell.blur()
        requestAnimationFrame(() => {
          const currentCells = view.dom.querySelectorAll('.cm-yana-rendered-block table th, .cm-yana-rendered-block table td')
          currentCells[nextIndex]?.focus()
        })
      })
    }
    for (const image of container.querySelectorAll('img[src^="yana-attachment:"]')) {
      const id = image.getAttribute('src').slice('yana-attachment:'.length)
      void loadAttachment(id).then((attachment) => {
        if (!attachment) throw new Error('Attachment is missing from this device.')
        image.src = URL.createObjectURL(attachment.blob)
      }).catch(() => {
        image.replaceWith(document.createTextNode(`[Image unavailable: ${image.alt}]`))
      })
    }
    for (const link of container.querySelectorAll('a[href^="yana-attachment:"]')) {
      const id = link.getAttribute('href').slice('yana-attachment:'.length)
      link.addEventListener('click', async (event) => {
        event.preventDefault()
        try {
          const attachment = await loadAttachment(id)
          if (!attachment) throw new Error('Attachment is missing from this device.')
          const url = URL.createObjectURL(attachment.blob)
          const download = document.createElement('a')
          download.href = url
          download.download = attachment.name
          download.click()
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Unable to open the attachment.', error)
          link.title = error.message
        }
      })
    }

    for (const diagram of container.querySelectorAll('.cm-yana-mermaid')) {
      const source = diagram.textContent ?? ''
      diagram.replaceChildren()
      diagram.textContent = 'Rendering diagram…'
      void import('mermaid').then(async ({ default: mermaid }) => {
        const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default'
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          suppressErrorRendering: true,
          theme,
          htmlLabels: false,
        })
        const result = await mermaid.render(`yana-mermaid-${++nextMermaidId}`, source)
        diagram.innerHTML = DOMPurify.sanitize(result.svg, { USE_PROFILES: { svg: true, svgFilters: true } })
      }).catch(() => {
        diagram.textContent = 'Diagram could not be rendered. Edit the Mermaid source to correct it.'
        diagram.classList.add('cm-yana-mermaid-error')
      })
    }

    const taskInputs = container.querySelectorAll('input.task-list-item-checkbox')
    for (const [taskIndex, input] of taskInputs.entries()) {
      const markers = [...this.source.matchAll(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[([ xX])\]/gm)]
      const marker = markers[taskIndex]
      if (!marker) continue
      input.type = 'checkbox'
      input.disabled = false
      input.addEventListener('change', () => {
        const markerStart = this.from + marker.index + marker[0].lastIndexOf('[')
        view.dispatch({
          changes: { from: markerStart, to: markerStart + 3, insert: input.checked ? '[x]' : '[ ]' },
        })
      })
    }

    container.addEventListener('click', (event) => {
      if (event.target.closest('a, input, button, th, td')) return
      view.dispatch({ selection: { anchor: this.from }, scrollIntoView: true })
      view.focus()
    })
    return container
  }

  ignoreEvent() {
    return true
  }

  destroy(dom) {
    for (const image of dom.querySelectorAll('img[src^="blob:"]')) {
      URL.revokeObjectURL(image.src)
    }
  }
}

export function buildRenderedMarkdown(state, focused, activeSourceTable) {
  const decorations = []
  const ranges = []
  const source = state.doc.toString()
  const selectionTouches = (from, to) => focused && state.selection.ranges.some(
    (selection) => selection.from < to && selection.to > from
      || selection.empty && selection.from >= from && selection.from < to,
  )
  const frontmatter = source.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)

  if (frontmatter && !selectionTouches(0, frontmatter[0].length)) {
    let errorMessage = ''
    try {
      parseYaml(frontmatter[1])
    } catch (error) {
      errorMessage = error.message
    }
    const html = `<pre class="md-yana-frontmatter${errorMessage ? ' md-yana-frontmatter-error' : ''}" title="${markdownRenderer.utils.escapeHtml(errorMessage ? `Invalid YAML: ${errorMessage}` : 'YAML frontmatter')}">${markdownRenderer.utils.escapeHtml(frontmatter[0])}</pre>`
    ranges.push({ from: 0, to: frontmatter[0].length })
    addWidget(decorations, 0, frontmatter[0].length, new RenderedMarkdownWidget(frontmatter[0], 0, html), true)
  }

  const tree = markdownLanguage.parser.parse(source)
  const codeRanges = []
  tree.iterate({
    enter(node) {
      if (node.name === 'CodeBlock' || node.name === 'FencedCode') {
        codeRanges.push({ from: node.from, to: node.to })
      }
    },
  })

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const openLine = state.doc.line(lineNumber)
    const opener = openLine.text.match(/^[ \t]*(\$\$|\\\[)[ \t]*$/)
    if (!opener || codeRanges.some((range) => openLine.from >= range.from && openLine.to <= range.to)) continue

    const closer = opener[1] === '$$' ? '$$' : '\\]'
    let closeLine = null
    for (let candidateNumber = lineNumber + 1; candidateNumber <= state.doc.lines; candidateNumber += 1) {
      const candidate = state.doc.line(candidateNumber)
      if (candidate.text.trim() === closer) {
        closeLine = candidate
        break
      }
    }
    if (!closeLine) continue

    if (!selectionTouches(openLine.from, closeLine.to)) {
      const mathSource = state.sliceDoc(openLine.to, closeLine.from).trim()
      ranges.push({ from: openLine.from, to: closeLine.to })
      addWidget(
        decorations,
        openLine.from,
        closeLine.to,
        new MathWidget(mathSource, true),
        true,
      )
    }
    lineNumber = closeLine.number
  }

  const linkDefinitions = [...source.matchAll(/^[ \t]{0,3}\[(?!\^)[^\]\n]+\]:[ \t]*\S+[^\n]*(?:\r?\n[ \t]+\S[^\n]*)?/gm)]
    .map((match) => match[0])
  const renderableBlocks = new Set([
    'Table',
    'FencedCode',
    'CodeBlock',
    'HTMLBlock',
    'HorizontalRule',
  ])

  // Keep lists and quotes in CodeMirror's source DOM so text clicks map to exact positions.
  for (let node = tree.topNode.firstChild; node; node = node.nextSibling) {
    if (!renderableBlocks.has(node.name)) continue
    if (node.name === 'Table' && activeSourceTable
      && activeSourceTable.from <= node.to && activeSourceTable.to >= node.from) continue
    if (ranges.some((range) => node.from >= range.from && node.to <= range.to)) continue
    if (selectionTouches(node.from, node.to)) continue
    const blockSource = state.sliceDoc(node.from, node.to)
    const renderSource = linkDefinitions.length
      ? `${blockSource}\n\n${linkDefinitions.join('\n')}`
      : blockSource
    const tableCellRanges = []
    if (node.name === 'Table') {
      tree.iterate({
        from: node.from,
        to: node.to,
        enter(child) {
          if (child.name === 'TableCell') {
            tableCellRanges.push({ from: child.from, to: child.to })
          }
        },
      })
    }
    ranges.push({ from: node.from, to: node.to })
    addWidget(
      decorations,
      node.from,
      node.to,
      new RenderedMarkdownWidget(
        blockSource,
        node.from,
        markdownRenderer.render(renderSource),
        tableCellRanges,
      ),
      true,
    )
  }

  return {
    decorations: Decoration.set(decorations, true),
    ranges,
    focused,
  }
}

export class TaskMarkerWidget extends WidgetType {
  constructor(checked) {
    super()
    this.checked = checked
  }

  eq(other) {
    return other.checked === this.checked
  }

  toDOM(view) {
    const checkbox = document.createElement('input')
    let focusBeforePointerDown = null
    checkbox.type = 'checkbox'
    checkbox.checked = this.checked
    checkbox.className = 'cm-yana-task-checkbox'
    checkbox.setAttribute('aria-label', this.checked ? 'Mark task incomplete' : 'Mark task complete')
    // A checkbox is a separate control: don't let its pointer event position the text caret.
    checkbox.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
    })
    checkbox.addEventListener('pointerdown', () => {
      focusBeforePointerDown = document.activeElement
    }, { capture: true })
    checkbox.addEventListener('click', (event) => event.stopPropagation())
    checkbox.addEventListener('change', () => {
      const marker = checkbox.checked ? '[x]' : '[ ]'
      const position = view.posAtDOM(checkbox)
      const line = view.state.doc.lineAt(position)
      const source = line.text
      const match = source.match(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[([ xX])\]/)
      if (!match) return
      const markerStart = line.from + match[0].lastIndexOf('[')
      view.dispatch({
        changes: { from: markerStart, to: markerStart + 3, insert: marker },
      })
      if (
        focusBeforePointerDown instanceof HTMLElement
        && focusBeforePointerDown !== view.contentDOM
        && focusBeforePointerDown !== checkbox
        && focusBeforePointerDown.isConnected
      ) {
        focusBeforePointerDown.focus({ preventScroll: true })
      }
    })
    return checkbox
  }

  ignoreEvent() {
    return true
  }
}

export class SubSupWidget extends WidgetType {
  constructor(value, kind) {
    super()
    this.value = value
    this.kind = kind
  }

  eq(other) {
    return other.value === this.value && other.kind === this.kind
  }

  toDOM() {
    const element = document.createElement(this.kind)
    element.className = 'cm-yana-sub-sup'
    element.textContent = this.value
    return element
  }
}

export class DOMWidget extends WidgetType {
  constructor(element) {
    super()
    this.element = element
  }

  toDOM() {
    return this.element
  }
}
