import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { editorExtensions } from './editor/config.js'
import MarkdownToolbar from './components/MarkdownToolbar.jsx'
import 'katex/dist/katex.min.css'
import './styles/index.css'

export default function MarkdownEditor({ value, onChange, status }) {
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

  useEffect(() => {
    const view = new EditorView({
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: editorExtensions(
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

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-canvas" ref={hostRef} />
      <MarkdownToolbar
        viewRef={viewRef}
        status={attachmentStatus || status}
        wordCount={wordCount}
        onAttachmentStatus={reportAttachmentStatus}
      />
    </div>
  )
}
