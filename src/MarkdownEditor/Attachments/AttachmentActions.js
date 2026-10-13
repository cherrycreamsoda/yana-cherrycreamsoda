/**
 * Turns files chosen in the toolbar or pasted/dropped into the editor into
 * local Markdown image/link references, saves them through AttachmentStorage,
 * and reports success or failure through the supplied status callback.
 * EditorExtensions wires paste/drop; MarkdownToolbar wires the file picker.
 */
import { saveAttachment } from './AttachmentStorage.js'
import { insertBlockWithSelection } from '../Formatting/MarkdownSourceEditing.js'

export function insertAttachments(view, files, onStatus) {
  // MARKDOWN REFERENCES AND SAVES
  // Insert stable local URIs immediately, then report persistence success or
  // failure when all IndexedDB writes settle.
  const entries = files.map((file) => {
    const id = crypto.randomUUID()
    const name = file.name.replace(/[\]\n\r()]/g, '')
    const url = `yana-attachment:${id}`
    return {
      file,
      id,
      markdown: file.type.startsWith('image/')
        ? `![${name}](${url})`
        : `[${name}](${url})`,
    }
  })
  const insertion = entries.map((entry) => entry.markdown).join('\n')
  const saves = entries.map(({ file, id }) => saveAttachment(file, id))

  insertBlockWithSelection(view, insertion, insertion.length)
  void Promise.all(saves).then(() => {
    onStatus(`${entries.length} attachment${entries.length === 1 ? '' : 's'} saved on this device`)
  }).catch((error) => {
    console.error('Unable to save an attachment.', error)
    onStatus(`Attachment could not be saved: ${error.message}`)
  })
}
