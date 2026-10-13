/**
 * Stores uploaded attachments in this browser's IndexedDB so a note's local
 * attachment links can be reopened later on this device. AttachmentActions
 * saves files here; InlineWidgets and RenderedMarkdown load them for previews
 * and downloads.
 */
let attachmentDatabase

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

export async function saveAttachment(file, id) {
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
