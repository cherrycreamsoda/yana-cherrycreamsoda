/**
 * Defines small CodeMirror widgets that visually replace inline Markdown
 * source: math, links, emoji, images, task checkboxes, and sub/superscript.
 * Widgets preserve Markdown as the source of truth; task and image widgets
 * update or load source-backed content through the editor and AttachmentStorage.
 */
import DOMPurify from 'dompurify'
import { Decoration, WidgetType } from '@codemirror/view'
import katex from 'katex'
import { loadAttachment } from '../Attachments/AttachmentStorage.js'
import { markdownRenderer } from './MarkdownRenderer.js'

export const emojiShortcodes = {
  smile: '😄',
  grin: '😁',
  joy: '😂',
  heart: '❤️',
  thumbsup: '👍',
  '+1': '👍',
  '-1': '👎',
  tada: '🎉',
  rocket: '🚀',
  warning: '⚠️',
  fire: '🔥',
  sparkles: '✨',
}

export function addWidget(decorations, from, to, widget, block = false) {
  decorations.push(Decoration.replace({ widget, block }).range(from, to))
}

function isSafeResourceUrl(value) {
  const url = value.trim()
  if (/^(?:https?:|mailto:|tel:|\/|\.\/|\.\.\/|#)/i.test(url)) return true
  return /^yana-attachment:[\w-]+$/i.test(url)
}

// INLINE MATH AND LINK REPLACEMENTS
// These widgets render safe visual equivalents while the underlying source is
// hidden from the current selection.
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
    element.className = this.display ? 'cmYanaRenderedMath cmYanaDisplayMath' : 'cmYanaRenderedMath'
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
    element.className = 'cmYanaInlineLinkWidget'

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

// SIMPLE INLINE VALUES
// Emoji and sub/superscript widgets replace only their syntax range; moving
// the cursor into that range restores the Markdown delimiters.
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
    element.className = 'cmYanaRenderedEmoji'
    element.textContent = this.emoji
    element.title = this.shortcode
    return element
  }
}

// IMAGE AND TASK CONTROLS
// Images load approved URLs or local blobs; task controls write checkbox
// changes back to the Markdown task marker.
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
      ? 'cmYanaImageWidget cmYanaImageAttachment'
      : 'cmYanaImageWidget'
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
    checkbox.className = 'cmYanaTaskCheckbox'
    checkbox.setAttribute('aria-label', this.checked ? 'Mark task incomplete' : 'Mark task complete')

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
    element.className = 'cmYanaSubSup'
    element.textContent = this.value
    return element
  }
}
