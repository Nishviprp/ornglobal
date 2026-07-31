import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  listPermissionsForRecord,
  findUserByEmail,
  shareRecord,
  updatePermissionLevel,
  revokeAccess,
} from '../../services/permissionService'
import { isValidEmail } from '../../utils/validators'

export default function ShareDialog({ recordId, open, onClose }) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState([])
  const [email, setEmail] = useState('')
  const [level, setLevel] = useState('read')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) refresh()
  }, [open, recordId])

  async function refresh() {
    const rows = await listPermissionsForRecord(recordId)
    setPermissions(rows)
  }

  async function handleShare(e) {
    e.preventDefault()
    setError('')

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const target = await findUserByEmail(email.trim())
      if (!target) {
        setError('No user found with that email.')
        return
      }
      await shareRecord({
        recordId,
        sharedWithUserId: target.id,
        permissionLevel: level,
        grantedBy: user.id,
      })
      setEmail('')
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to share record.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLevelChange(permission, newLevel) {
    await updatePermissionLevel(permission.id, newLevel)
    await refresh()
  }

  async function handleRevoke(permission) {
    await revokeAccess(permission.id)
    await refresh()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Share this procedure</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleShare} className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@hospital.org"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="read">Read only</option>
              <option value="write">Can edit</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Sharing…' : 'Share'}
          </button>
        </form>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-gray-700">People with access</p>
          {permissions.length === 0 ? (
            <p className="text-sm text-gray-400">Not shared with anyone yet.</p>
          ) : (
            <ul className="space-y-2">
              {permissions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {p.profiles?.first_name} {p.profiles?.last_name}
                    </p>
                    <p className="truncate text-xs text-gray-500">{p.profiles?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={p.permission_level}
                      onChange={(e) => handleLevelChange(p, e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-brand-500 focus:outline-none"
                    >
                      <option value="read">Read only</option>
                      <option value="write">Can edit</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRevoke(p)}
                      className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
