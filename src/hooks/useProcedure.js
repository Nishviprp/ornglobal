import { useCallback, useEffect, useState } from 'react'
import {
  getRecord,
  ensureDefaultSections,
  addCustomSection,
  renameSection,
  updateSectionData,
  deleteSection,
} from '../services/procedureService'

export function useProcedure(recordId) {
  const [record, setRecord] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!recordId) return
    setLoading(true)
    setError(null)
    try {
      const [r, s] = await Promise.all([getRecord(recordId), ensureDefaultSections(recordId)])
      setRecord(r)
      setSections(s)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [recordId])

  useEffect(() => {
    load()
  }, [load])

  const addSection = useCallback(
    async (name) => {
      const created = await addCustomSection(recordId, name, sections.length)
      setSections((prev) => [...prev, { ...created, procedure_files: [], voice_recordings: [] }])
      return created
    },
    [recordId, sections.length]
  )

  const rename = useCallback(async (sectionId, name) => {
    const updated = await renameSection(sectionId, name)
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...updated } : s)))
  }, [])

  const updateData = useCallback(async (sectionId, dataJson) => {
    const updated = await updateSectionData(sectionId, dataJson)
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...updated } : s)))
  }, [])

  const removeSection = useCallback(async (sectionId) => {
    await deleteSection(sectionId)
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
  }, [])

  const patchSectionFiles = useCallback((sectionId, updater) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, procedure_files: updater(s.procedure_files || []) } : s))
    )
  }, [])

  const patchSectionRecordings = useCallback((sectionId, updater) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, voice_recordings: updater(s.voice_recordings || []) } : s))
    )
  }, [])

  return {
    record,
    sections,
    loading,
    error,
    reload: load,
    addSection,
    rename,
    updateData,
    removeSection,
    patchSectionFiles,
    patchSectionRecordings,
  }
}
