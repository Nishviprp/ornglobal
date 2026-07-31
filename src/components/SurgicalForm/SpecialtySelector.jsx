import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listSpecialties, addSpecialty } from '../../services/procedureService'

export default function SpecialtySelector({ value, onChange, disabled }) {
  const { user } = useAuth()
  const [specialties, setSpecialties] = useState([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    listSpecialties().then(setSpecialties).catch(() => setSpecialties([]))
  }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    const created = await addSpecialty(newName.trim(), null, user?.id)
    setSpecialties((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    onChange(created.id)
    setNewName('')
    setAdding(false)
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Surgical Specialty</label>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
      >
        <option value="">Select specialty</option>
        {specialties.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {!disabled &&
        (!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-1 text-sm font-medium text-brand-600 hover:underline"
          >
            + Add new specialty
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Urology"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Add
            </button>
          </div>
        ))}
    </div>
  )
}
