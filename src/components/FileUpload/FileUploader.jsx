import { useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { replaceFile } from '../../services/fileService'
import { useFileUpload } from '../../hooks/useFileUpload'
import MediaPreview from './MediaPreview'

const ACCEPTED = '.jpg,.jpeg,.png,.mp4,.mov,.pdf,.txt,image/*,video/*,application/pdf,text/plain'

export default function FileUploader({ sectionId, files, canWrite, onFilesChange }) {
  const { user } = useAuth()
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const { upload, remove, download, uploading } = useFileUpload({
    userId: user?.id,
    sectionId,
    onUploaded: (record) => onFilesChange((prev) => [...prev, record]),
    onDeleted: (id) => onFilesChange((prev) => prev.filter((f) => f.id !== id)),
  })

  async function handleFiles(fileList) {
    for (const file of Array.from(fileList)) {
      await upload(file)
    }
  }

  async function handleReplace(oldFile, newFile) {
    const updated = await replaceFile({
      fileRecordId: oldFile.id,
      userId: user.id,
      sectionId,
      file: newFile,
    })
    onFilesChange((prev) => prev.map((f) => (f.id === oldFile.id ? updated : f)))
  }

  async function handleDownload(file) {
    await download(file.file_url, file.file_name)
  }

  async function handleDelete(file) {
    await remove(file.id)
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400'
          }`}
        >
          <span className="text-2xl">📤</span>
          <p className="mt-1 text-sm font-medium text-gray-700">
            Tap to upload <span className="hidden sm:inline">or drag files here</span>
          </p>
          <p className="text-xs text-gray-400">Images, videos, PDFs, or text files</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      )}

      {uploading && <p className="text-sm text-brand-600">Uploading…</p>}

      {files?.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((file) => (
            <MediaPreview
              key={file.id}
              file={file}
              canWrite={canWrite}
              onDownload={handleDownload}
              onReplace={handleReplace}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
