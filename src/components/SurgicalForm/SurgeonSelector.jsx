import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listSurgeons, addSurgeon } from '../../services/procedureService'

export default function SurgeonSelector({ value, onChange, specialtyId, disabled }) {
  const { user, profile } = useAuth()
  const [surgeons, setSurgeons] = useState([])
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    listSurgeons().then(setSurgeons).catch(() => setSurgeons([]))
  }, [])

  const filtered = surgeons.filter((s) => {
    const matchesSpecialty = !specialtyId || s.specialty_id === specialtyId
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    return matchesSpecialty && matchesSearch
  })

  async function handleAdd() {
    if (!newName.trim()) return
    const created = await addSurgeon({
      name: newName.trim(),
      specialtyId,
      hospitalId: profile?.hospital_id,
      userId: user?.id,
    })
    setSurgeons((prev) => [...prev, created])
    onChange(created.id)
    setNewName('')
    setAdding(false)
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Surgeon Name</label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search surgeons…"
        disabled={disabled}
        className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
      />
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
        size={filtered.length > 1 ? Math.min(filtered.length + 1, 6) : undefined}
      >
        <option value="">Select surgeon</option>
        {filtered.map((s) => (
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
            + Add new surgeon
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Dr. Jane Smith"
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
