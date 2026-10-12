import { useRef } from 'react'
import { insertAttachments } from '../attachments/storage.js'
import { insertBlockWithSelection, runToolbarAction } from '../editor/actions.js'
import { ToolbarButton, ToolbarMenu } from './ToolbarControls.jsx'

export default function MarkdownToolbar({ viewRef, status, wordCount, onAttachmentStatus }) {
  const fileInputRef = useRef(null)

  return (
    <div className="md-toolbar" role="toolbar" aria-label="Markdown formatting">
      <div className="md-toolbar-scroll">
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          multiple
          aria-label="Choose attachments"
          onChange={(event) => {
            const files = [...event.target.files]
            if (files.length && viewRef.current) {
              insertAttachments(viewRef.current, files, onAttachmentStatus, insertBlockWithSelection)
            }
            event.target.value = ''
          }}
        />
        <label className="md-heading-picker">
          <span className="visually-hidden">Block style</span>
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
        <span className="md-toolbar-divider" aria-hidden="true" />
        <ToolbarButton action="bold" label="Bold" viewRef={viewRef}><strong>B</strong></ToolbarButton>
        <ToolbarButton action="italic" label="Italic" viewRef={viewRef}><em>I</em></ToolbarButton>
        <ToolbarButton action="strike" label="Strikethrough" viewRef={viewRef}><s>S</s></ToolbarButton>
        <ToolbarButton action="inline-code" label="Inline code" viewRef={viewRef}><code>&lt;/&gt;</code></ToolbarButton>
        <span className="md-toolbar-divider" aria-hidden="true" />
        <ToolbarButton action="bullet" label="Bulleted list" viewRef={viewRef}>• List</ToolbarButton>
        <ToolbarButton action="numbered" label="Numbered list" viewRef={viewRef}>1. List</ToolbarButton>
        <ToolbarButton action="task" label="Task list" viewRef={viewRef}>☑ Task</ToolbarButton>
        <ToolbarButton action="quote" label="Blockquote" viewRef={viewRef}>“ ”</ToolbarButton>
        <span className="md-toolbar-divider" aria-hidden="true" />
        <ToolbarButton action="link" label="Link" viewRef={viewRef}>↗</ToolbarButton>
        <ToolbarButton action="image" label="Image" viewRef={viewRef}>▧</ToolbarButton>
        <button
          type="button"
          className="md-toolbar-button"
          aria-label="Attach files"
          title="Attach files from this device"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          ↥ Attach
        </button>
        <ToolbarButton action="code-block" label="Code block" viewRef={viewRef}><code>{'{ }'}</code></ToolbarButton>
        <ToolbarButton action="table" label="Insert table" viewRef={viewRef}>▦</ToolbarButton>
        <ToolbarMenu
          title="Insert"
          viewRef={viewRef}
          actions={[
            ['highlight', 'Highlighted text'],
            ['rule', 'Horizontal rule'],
            ['footnote-ref', 'Footnote reference'],
            ['footnote-def', 'Footnote definition'],
            ['math-inline', 'Inline math'],
            ['math-block', 'Math block'],
            ['subscript', 'Subscript'],
            ['superscript', 'Superscript'],
            ['wiki-link', 'Link to a note'],
            ['hashtag', 'Hashtag'],
            ['callout', 'Callout'],
            ['mermaid', 'Mermaid diagram'],
            ['emoji', 'Emoji shortcode'],
            ['frontmatter', 'YAML frontmatter'],
            ['file-embed', 'File attachment link'],
          ]}
        />
      </div>
      <span className="md-toolbar-hint" aria-live="polite">
        {status}<span className="md-toolbar-hint-separator" aria-hidden="true">·</span>
        {wordCount} {wordCount === 1 ? 'word' : 'words'}<span className="md-toolbar-hint-separator" aria-hidden="true">·</span>
        ⌘/Ctrl+B bold · ⌘/Ctrl+I italic · ⌘/Ctrl+K link
      </span>
    </div>
  )
}
