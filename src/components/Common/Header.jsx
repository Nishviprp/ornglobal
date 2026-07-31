import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { initials, roleLabel } from '../../utils/formatters'

export default function Header({ onToggleSidebar }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Toggle navigation"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-brand-700">OrnGlobal</span>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {initials(profile?.first_name, profile?.last_name)}
          </span>
          <span className="hidden text-sm text-gray-700 sm:inline">
            {profile?.first_name || 'Account'}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
            <div className="border-b border-gray-100 px-4 py-2">
              <p className="truncate text-sm font-medium text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="truncate text-xs text-gray-500">{profile?.email}</p>
              <p className="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                {roleLabel(profile?.role)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
