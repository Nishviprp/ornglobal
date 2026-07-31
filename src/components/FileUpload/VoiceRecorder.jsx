import { useRef, useState } from 'react'
import { createAudioRecorder, getAudioDuration } from '../../utils/audioUtils'
import { useAuth } from '../../hooks/useAuth'
import { uploadVoiceRecording, deleteVoiceRecording } from '../../services/fileService'
import { VoiceRecordingPreview } from './MediaPreview'
import { formatDuration } from '../../utils/formatters'

export default function VoiceRecorder({ sectionId, recordings, canWrite, onRecordingsChange }) {
  const { user } = useAuth()
  const recorderRef = useRef(null)
  const timerRef = useRef(null)

  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [pendingBlob, setPendingBlob] = useState(null)
  const [pendingUrl, setPendingUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function startRecording() {
    setError('')
    try {
      recorderRef.current = createAudioRecorder()
      await recorderRef.current.start()
      setIsRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch {
      setError('Microphone access was denied or is unavailable.')
    }
  }

  async function stopRecording() {
    clearInterval(timerRef.current)
    setIsRecording(false)
    const blob = await recorderRef.current.stop()
    setPendingBlob(blob)
    setPendingUrl(URL.createObjectURL(blob))
  }

  function discardRecording() {
    setPendingBlob(null)
    setPendingUrl(null)
    setElapsed(0)
  }

  async function saveRecording() {
    if (!pendingBlob) return
    setSaving(true)
    try {
      const duration = await getAudioDuration(pendingBlob)
      const record = await uploadVoiceRecording({
        userId: user.id,
        sectionId,
        blob: pendingBlob,
        duration,
      })
      onRecordingsChange((prev) => [...prev, record])
      discardRecording()
    } catch (err) {
      setError(err.message || 'Failed to save recording.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(recording) {
    await deleteVoiceRecording(recording.id)
    onRecordingsChange((prev) => prev.filter((r) => r.id !== recording.id))
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          {!isRecording && !pendingBlob && (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
              Record voice note
            </button>
          )}

          {isRecording && (
            <>
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                Stop
              </button>
              <span className="text-sm font-mono text-gray-600">{formatDuration(elapsed)}</span>
            </>
          )}

          {pendingBlob && !isRecording && (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <audio controls src={pendingUrl} className="w-full sm:w-auto" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveRecording}
                  disabled={saving}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={discardRecording}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {recordings?.length > 0 && (
        <div className="space-y-2">
          {recordings.map((recording) => (
            <VoiceRecordingPreview
              key={recording.id}
              recording={recording}
              canWrite={canWrite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
