import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProcedure } from '../../hooks/useProcedure'
import { createRecord, updateRecord, deleteRecord } from '../../services/procedureService'
import { getMyPermission } from '../../services/permissionService'
import SpecialtySelector from './SpecialtySelector'
import SurgeonSelector from './SurgeonSelector'
import ProcedureSelector from './ProcedureSelector'
import FormSection from './FormSection'
import ShareDialog from '../Permissions/ShareDialog'
import Loading from '../Common/Loading'

function NewProcedureForm() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [specialtyId, setSpecialtyId] = useState('')
  const [surgeonId, setSurgeonId] = useState('')
  const [procedureId, setProcedureId] = useState('')
  const [patientReference, setPatientReference] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!specialtyId) {
      setError('Select a surgical specialty to continue.')
      return
    }
    setSubmitting(true)
    try {
      const record = await createRecord({
        userId: user.id,
        specialtyId,
        surgeonId,
        procedureId,
        hospitalId: profile?.hospital_id,
        patientReference,
      })
      navigate(`/procedures/${record.id}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to create procedure.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-gray-900">New Surgical Procedure</h1>
      <form onSubmit={handleCreate} className="mt-6 space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <SpecialtySelector value={specialtyId} onChange={setSpecialtyId} />
        <SurgeonSelector value={surgeonId} onChange={setSurgeonId} specialtyId={specialtyId} />
        <ProcedureSelector value={procedureId} onChange={setProcedureId} surgeonId={surgeonId} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Patient reference (optional)</label>
          <input
            value={patientReference}
            onChange={(e) => setPatientReference(e.target.value)}
            placeholder="MRN or case reference"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create procedure'}
        </button>
      </form>
    </div>
  )
}

function ExistingProcedureForm({ recordId }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const {
    record,
    sections,
    loading,
    error,
    addSection,
    rename,
    updateData,
    removeSection,
    patchSectionFiles,
    patchSectionRecordings,
  } = useProcedure(recordId)

  const [canWrite, setCanWrite] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [addingSection, setAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')

  useEffect(() => {
    if (!record || !user) return
    if (record.user_id === user.id || profile?.role === 'higher_authority') {
      setCanWrite(true)
      return
    }
    getMyPermission(recordId, user.id).then((perm) => setCanWrite(perm?.permission_level === 'write'))
  }, [record, user, profile, recordId])

  const isOwner = record?.user_id === user?.id
  const canShare = isOwner || profile?.role === 'higher_authority'
  const canDelete = isOwner || profile?.role === 'higher_authority'

  async function handleStatusChange(status) {
    await updateRecord(recordId, { status })
  }

  async function handleAddSection(e) {
    e.preventDefault()
    if (!newSectionName.trim()) return
    await addSection(newSectionName.trim())
    setNewSectionName('')
    setAddingSection(false)
  }

  async function handleDeleteRecord() {
    if (!window.confirm('Delete this procedure and all its data? This cannot be undone.')) return
    await deleteRecord(recordId)
    navigate('/dashboard')
  }

  if (loading) return <Loading fullScreen label="Loading procedure…" />
  if (error) return <p className="p-6 text-sm text-red-600">Failed to load this procedure. You may not have access.</p>
  if (!record) return null

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {record.surgical_procedures?.name || 'Untitled procedure'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {record.surgical_specialties?.name || 'No specialty'} · {record.surgeons?.name || 'No surgeon'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Owner: {record.profiles?.first_name} {record.profiles?.last_name}
              {!isOwner && ` · You have ${canWrite ? 'edit' : 'read-only'} access`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={record.status}
              disabled={!canWrite}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-50"
            >
              <option value="draft">Draft</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            {canShare && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                Share
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={handleDeleteRecord}
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <FormSection
            key={section.id}
            section={section}
            canWrite={canWrite}
            onRename={(name) => rename(section.id, name)}
            onDelete={() => removeSection(section.id)}
            onNotesChange={(dataJson) => updateData(section.id, dataJson)}
            onFilesChange={(updater) => patchSectionFiles(section.id, updater)}
            onRecordingsChange={(updater) => patchSectionRecordings(section.id, updater)}
          />
        ))}
      </div>

      {canWrite && (
        <div className="rounded-xl border border-dashed border-gray-300 p-4">
          {!addingSection ? (
            <button
              type="button"
              onClick={() => setAddingSection(true)}
              className="w-full rounded-lg bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              + Add More Features
            </button>
          ) : (
            <form onSubmit={handleAddSection} className="flex gap-2">
              <input
                autoFocus
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingSection(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      <ShareDialog recordId={recordId} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}

export default function SurgicalForm() {
  const { id } = useParams()
  if (id === 'new') return <NewProcedureForm />
  return <ExistingProcedureForm recordId={id} />
}
