import { useCallback, useState } from 'react'
import { uploadFile, deleteFileRecord, getFileSignedUrl } from '../services/fileService'

export function useFileUpload({ userId, sectionId, onUploaded, onDeleted }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const upload = useCallback(
    async (file) => {
      setUploading(true)
      setError(null)
      try {
        const record = await uploadFile({ userId, sectionId, file })
        onUploaded?.(record)
        return record
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [userId, sectionId, onUploaded]
  )

  const remove = useCallback(
    async (fileRecordId) => {
      await deleteFileRecord(fileRecordId)
      onDeleted?.(fileRecordId)
    },
    [onDeleted]
  )

  const download = useCallback(async (path, fileName) => {
    const url = await getFileSignedUrl(path)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }, [])

  return { upload, remove, download, uploading, error }
}
