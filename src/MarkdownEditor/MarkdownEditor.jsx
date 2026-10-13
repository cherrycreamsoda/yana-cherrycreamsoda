/**
 * Public React boundary for the Markdown editor. The parent supplies Markdown,
 * a change callback, and status; the initial value seeds CodeMirror and later
 * prop updates do not replace the live document. This component connects the
 * editor host to the toolbar, mounts CodeMirror after the host exists, and
 * destroys the editor and status timer during cleanup.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { createEditorExtensions } from './EditorBehavior/EditorExtensions.js'
import { MarkdownToolbar } from './Toolbar/MarkdownToolbar.jsx'
import './Styles/MarkdownEditor.css'
import 'katex/dist/katex.min.css'

export function MarkdownEditor({ value, onChange, status }) {
  const hostRef = useRef(null)
  const viewRef = useRef(null)
  const attachmentStatusTimeoutRef = useRef(null)
  const initialValueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const [attachmentStatus, setAttachmentStatus] = useState('')
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const reportAttachmentStatus = useCallback((message) => {
    setAttachmentStatus(message)
    window.clearTimeout(attachmentStatusTimeoutRef.current)
    attachmentStatusTimeoutRef.current = window.setTimeout(() => setAttachmentStatus(''), 5000)
  }, [])

  // EDITOR LIFECYCLE
  // Mount after the host exists and release the CodeMirror view and status timer
  // together so editor handlers do not outlive this React component.
  useEffect(() => {
    const view = new EditorView({
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: createEditorExtensions(
          (nextValue) => onChangeRef.current(nextValue),
          reportAttachmentStatus,
        ),
      }),
      parent: hostRef.current,
    })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
      window.clearTimeout(attachmentStatusTimeoutRef.current)
    }
  }, [reportAttachmentStatus])

  // TOOLBAR CONNECTION
  // Share the editor reference, resolved status, and word count with the UI.
  return (
    <div className="markdownEditor">
      <div className="markdownEditorCanvas" ref={hostRef} />
      <MarkdownToolbar
        viewRef={viewRef}
        status={attachmentStatus || status}
        wordCount={wordCount}
        onAttachmentStatus={reportAttachmentStatus}
      />
    </div>
  )
}
