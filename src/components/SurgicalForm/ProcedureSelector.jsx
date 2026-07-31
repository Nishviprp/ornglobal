import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listProcedures, addProcedure } from '../../services/procedureService'

export default function ProcedureSelector({ value, onChange, surgeonId, disabled }) {
  const { user } = useAuth()
  const [procedures, setProcedures] = useState([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    listProcedures().then(setProcedures).catch(() => setProcedures([]))
  }, [])

  const filtered = procedures.filter((p) => !surgeonId || p.surgeon_id === surgeonId)

  async function handleAdd() {
    if (!newName.trim()) return
    const created = await addProcedure({ name: newName.trim(), surgeonId, userId: user?.id })
    setProcedures((prev) => [...prev, created])
    onChange(created.id)
    setNewName('')
    setAdding(false)
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Surgical Procedure</label>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
      >
        <option value="">
          {surgeonId ? 'Select procedure' : 'Select a surgeon first (optional)'}
        </option>
        {filtered.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
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
            + Add new procedure
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Total Knee Replacement"
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
