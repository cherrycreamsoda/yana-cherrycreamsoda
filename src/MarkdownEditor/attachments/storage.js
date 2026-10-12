let attachmentDatabase

// Keep attachment bytes local; Markdown only stores a stable, app-specific URI.
function openAttachmentDatabase() {
  if (!attachmentDatabase) {
    attachmentDatabase = new Promise((resolve, reject) => {
      const request = indexedDB.open('yana-markdown-attachments', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('files')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  return attachmentDatabase
}

async function saveAttachment(file, id) {
  const database = await openAttachmentDatabase()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction('files', 'readwrite')
    transaction.objectStore('files').put({ blob: file, name: file.name, type: file.type }, id)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
  return id
}

export async function loadAttachment(id) {
  const database = await openAttachmentDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction('files').objectStore('files').get(id)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

export function insertAttachments(view, files, onStatus, insertBlockWithSelection) {
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
