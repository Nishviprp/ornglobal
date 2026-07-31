import { useEffect, useState } from 'react'
import { getFileSignedUrl } from '../../services/fileService'
import { formatFileSize, formatDuration, formatDateTime } from '../../utils/formatters'

function iconFor(fileType) {
  if (fileType?.startsWith('image/')) return '🖼️'
  if (fileType?.startsWith('video/')) return '🎬'
  if (fileType?.startsWith('audio/')) return '🎙️'
  if (fileType === 'application/pdf') return '📄'
  return '📎'
}

export default function MediaPreview({ file, canWrite, onDownload, onReplace, onDelete }) {
  const [signedUrl, setSignedUrl] = useState(null)

  useEffect(() => {
    let active = true
    getFileSignedUrl(file.file_url)
      .then((url) => active && setSignedUrl(url))
      .catch(() => active && setSignedUrl(null))
    return () => {
      active = false
    }
  }, [file.file_url])

  const isImage = file.file_type?.startsWith('image/')
  const isVideo = file.file_type?.startsWith('video/')
  const isAudio = file.file_type?.startsWith('audio/')

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        {isImage && signedUrl ? (
          <img src={signedUrl} alt={file.file_name} className="h-14 w-14 rounded object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded bg-gray-50 text-2xl">
            {iconFor(file.file_type)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{file.file_name}</p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.file_size)} · {formatDateTime(file.uploaded_at)}
          </p>
        </div>
      </div>

      {isVideo && signedUrl && (
        <video controls className="w-full rounded" src={signedUrl}>
          <track kind="captions" />
        </video>
      )}
      {isAudio && signedUrl && <audio controls className="w-full" src={signedUrl} />}

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => onDownload(file)}
          className="rounded-md bg-gray-100 px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-200"
        >
          Download
        </button>
        {canWrite && (
          <>
            <label className="cursor-pointer rounded-md bg-gray-100 px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-200">
              Replace
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onReplace(file, f)
                  e.target.value = ''
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => onDelete(file)}
              className="rounded-md bg-red-50 px-2.5 py-1.5 font-medium text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function VoiceRecordingPreview({ recording, canWrite, onDelete }) {
  const [signedUrl, setSignedUrl] = useState(null)

  useEffect(() => {
    let active = true
    getFileSignedUrl(recording.recording_url)
      .then((url) => active && setSignedUrl(url))
      .catch(() => active && setSignedUrl(null))
    return () => {
      active = false
    }
  }, [recording.recording_url])

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">
          🎙️ Voice note · {formatDuration(recording.duration)}
        </p>
        {canWrite && (
          <button
            type="button"
            onClick={() => onDelete(recording)}
            className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        )}
      </div>
      {signedUrl && <audio controls className="w-full" src={signedUrl} />}
    </div>
  )
}
