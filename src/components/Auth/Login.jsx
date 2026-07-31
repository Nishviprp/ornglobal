import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { listHospitals } from '../../services/authService'
import { isValidEmail } from '../../utils/validators'
import { getLocal, setLocal } from '../../utils/storage'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [hospitals, setHospitals] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hospitalId, setHospitalId] = useState(getLocal('lastHospitalId', ''))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listHospitals().then(setHospitals).catch(() => setHospitals([]))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }

    setSubmitting(true)
    try {
      if (hospitalId) setLocal('lastHospitalId', hospitalId)
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        navigate('/verify-otp', { state: { email } })
        return
      }
      setError(err.message || 'Failed to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
        <h1 className="text-xl font-semibold text-gray-900">Sign in to OrnGlobal</h1>
        <p className="mt-1 text-sm text-gray-500">Surgical procedure management</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="you@hospital.org"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="hospital" className="mb-1 block text-sm font-medium text-gray-700">
              Hospital
            </label>
            <select
              id="hospital"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select hospital (optional)</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
