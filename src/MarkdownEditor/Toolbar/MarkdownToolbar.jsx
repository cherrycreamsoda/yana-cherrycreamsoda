/**
 * Displays the Markdown toolbar: text-style selector, formatting controls,
 * insert menu, attachment picker, word count/status, and shortcut help. It
 * routes formatting through FormattingActionRouter and sends chosen files to
 * AttachmentActions; MarkdownEditor supplies the editor reference and status.
 */
import { useEffect, useRef, useState } from 'react'
import { insertAttachments } from '../Attachments/AttachmentActions.js'
import { runToolbarAction } from '../Formatting/FormattingActionRouter.js'

function toolbarButton({ action, label, title, viewRef, children, key }) {
  return (
    <button
      key={key}
      type="button"
      className="mdToolbarButton"
      aria-label={label}
      title={title ?? label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        runToolbarAction(viewRef.current, action)
        event.currentTarget.closest('details')?.removeAttribute('open')
      }}
    >
      {children ?? label}
    </button>
  )
}

function toolbarMenu({ title, viewRef, actions }) {
  return (
    <details className="mdToolbarMenu">
      <summary aria-label={title}>{title}<span aria-hidden="true">⌄</span></summary>
      <div className="mdToolbarMenuPanel">
        {actions.map(([action, label]) => toolbarButton({
          key: action,
          action,
          label,
          viewRef,
        }))}
      </div>
    </details>
  )
}

export function MarkdownToolbar({ viewRef, status, wordCount, onAttachmentStatus }) {
  const fileInputRef = useRef(null)
  const helpRef = useRef(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useEffect(() => {
    if (!shortcutsOpen) return undefined

    function closeOnOutsideClick(event) {
      if (!helpRef.current?.contains(event.target)) setShortcutsOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setShortcutsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [shortcutsOpen])

  return (
    <div className="mdToolbar" role="toolbar" aria-label="Markdown formatting">
      <div className="mdToolbarScroll">
        {/* ATTACHMENT PICKER */}
        {/* Files are handed to the same action used by editor paste/drop. */}
        <input
          ref={fileInputRef}
          className="visuallyHidden"
          type="file"
          multiple
          aria-label="Choose attachments"
          onChange={(event) => {

            const files = [...event.target.files]
            if (files.length && viewRef.current) {
              insertAttachments(viewRef.current, files, onAttachmentStatus)
            }
            event.target.value = ''
          }}
        />
        {/* FORMATTING CONTROLS */}
        {/* Every control routes its action name through the shared router. */}
        <label className="mdHeadingPicker">
          <span className="visuallyHidden">Block style</span>
          <select
            defaultValue=""
            aria-label="Block style"
            onChange={(event) => {

              if (event.target.value) runToolbarAction(viewRef.current, event.target.value)
              event.target.value = ''
            }}
          >
            <option value="">Text style</option>
            <option value="heading1">Heading 1</option>
            <option value="heading2">Heading 2</option>
            <option value="heading3">Heading 3</option>
            <option value="heading4">Heading 4</option>
            <option value="heading5">Heading 5</option>
            <option value="heading6">Heading 6</option>
          </select>
        </label>
        <span className="mdToolbarDivider" aria-hidden="true" />
        {toolbarButton({ action: 'bold', label: 'Bold', viewRef, children: <strong>B</strong> })}
        {toolbarButton({ action: 'italic', label: 'Italic', viewRef, children: <em>I</em> })}
        {toolbarButton({ action: 'strike', label: 'Strikethrough', viewRef, children: <s>S</s> })}
        {toolbarButton({ action: 'inline-code', label: 'Inline code', viewRef, children: <code>&lt;/&gt;</code> })}
        <span className="mdToolbarDivider" aria-hidden="true" />
        {toolbarButton({ action: 'bullet', label: 'Bulleted list', viewRef, children: '• List' })}
        {toolbarButton({ action: 'numbered', label: 'Numbered list', viewRef, children: '1. List' })}
        {toolbarButton({ action: 'task', label: 'Task list', viewRef, children: '☑ Task' })}
        {toolbarButton({ action: 'quote', label: 'Blockquote', viewRef, children: '“ ”' })}
        <span className="mdToolbarDivider" aria-hidden="true" />
        {toolbarButton({ action: 'link', label: 'Link', viewRef, children: '↗' })}
        {toolbarButton({ action: 'image', label: 'Image', viewRef, children: '▧' })}
        <button
          type="button"
          className="mdToolbarButton"
          aria-label="Attach files"
          title="Attach files from this device"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          ↥ Attach
        </button>
        {toolbarButton({ action: 'code-block', label: 'Code block', viewRef, children: <code>{'{ }'}</code> })}
        {toolbarButton({ action: 'table', label: 'Insert table', viewRef, children: '▦' })}
        {toolbarMenu({
          title: 'Insert',
          viewRef,
          actions: [
            ['highlight', 'Highlighted text'],
            ['rule', 'Horizontal rule'],
            ['math-inline', 'Inline math'],
            ['math-block', 'Math block'],
            ['subscript', 'Subscript'],
            ['superscript', 'Superscript'],
            ['wiki-link', 'Link to a note'],
            ['hashtag', 'Hashtag'],
            ['callout', 'Callout'],
            ['mermaid', 'Mermaid diagram'],
            ['emoji', 'Emoji shortcode'],
            ['file-embed', 'File attachment link'],
          ],
        })}
      </div>
      {/* STATUS AND SHORTCUT HELP */}
      {/* The parent supplies the live word count and transient attachment status. */}
      <div className="mdToolbarMeta">
        <span className="mdToolbarHint" aria-live="polite">
          {status}<span className="mdToolbarHintSeparator" aria-hidden="true">·</span>
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <div className="mdToolbarHelp" ref={helpRef}>
          <section
            className="mdToolbarShortcuts"
            id="mdToolbarShortcuts"
            aria-labelledby="mdToolbarShortcutsTitle"
            hidden={!shortcutsOpen}
          >
            <h2 id="mdToolbarShortcutsTitle">Keyboard shortcuts</h2>
            <dl>
              <div><dt>Bold</dt><dd>⌘/Ctrl+B</dd></div>
              <div><dt>Italic</dt><dd>⌘/Ctrl+I</dd></div>
              <div><dt>Strikethrough</dt><dd>⌘/Ctrl+Shift+X</dd></div>
              <div><dt>Insert link</dt><dd>⌘/Ctrl+K</dd></div>
            </dl>
          </section>
          <button
            className="mdToolbarInfo"
            type="button"
            aria-label="Keyboard shortcuts"
            aria-expanded={shortcutsOpen}
            aria-controls="mdToolbarShortcuts"
            title="Keyboard shortcuts"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShortcutsOpen((open) => !open)}
          >
            <span aria-hidden="true">i</span>
          </button>
        </div>
      </div>
    </div>
  )
}
