import { useEffect, useRef, useState } from 'react'
import FileUploader from '../FileUpload/FileUploader'
import VoiceRecorder from '../FileUpload/VoiceRecorder'

export default function FormSection({
  section,
  canWrite,
  onRename,
  onDelete,
  onNotesChange,
  onFilesChange,
  onRecordingsChange,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState(section.section_name)
  const [notes, setNotes] = useState(section.data_json?.notes || '')
  const saveTimer = useRef(null)

  useEffect(() => {
    setNotes(section.data_json?.notes || '')
  }, [section.id])

  function handleNotesChange(value) {
    setNotes(value)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      onNotesChange({ ...section.data_json, notes: value })
    }, 600)
  }

  function handleRenameSubmit() {
    if (nameDraft.trim() && nameDraft !== section.section_name) {
      onRename(nameDraft.trim())
    }
    setRenaming(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {renaming ? (
            <input
              autoFocus
              value={nameDraft}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
          ) : (
            <span className="font-medium text-gray-900">{section.section_name}</span>
          )}
        </button>

        {canWrite && section.section_type === 'custom' && !renaming && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setRenaming(true)
              }}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Rename section"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete section"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="space-y-4 border-t border-gray-100 px-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              disabled={!canWrite}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
              placeholder="Add details for this section…"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Files</p>
            <FileUploader
              sectionId={section.id}
              files={section.procedure_files}
              canWrite={canWrite}
              onFilesChange={onFilesChange}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Voice notes</p>
            <VoiceRecorder
              sectionId={section.id}
              recordings={section.voice_recordings}
              canWrite={canWrite}
              onRecordingsChange={onRecordingsChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
