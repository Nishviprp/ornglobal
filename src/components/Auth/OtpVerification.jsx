import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { verifySignupOtp, resendSignupOtp } from '../../services/authService'
import { isValidOtp } from '../../utils/validators'

export default function OtpVerification() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email) {
      setError('Missing email — please sign up again.')
      return
    }
    if (!isValidOtp(otp)) {
      setError('Enter the 6-digit code sent to your email.')
      return
    }

    setSubmitting(true)
    try {
      await verifySignupOtp({ email, token: otp })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid or expired code.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setError('')
    setInfo('')
    setResending(true)
    try {
      await resendSignupOtp({ email })
      setInfo('A new code has been sent to your email.')
    } catch (err) {
      setError(err.message || 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
        <h1 className="text-xl font-semibold text-gray-900">Verify your email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the 6-digit code we sent to <span className="font-medium">{email || 'your email'}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="otp" className="mb-1 block text-sm font-medium text-gray-700">
              Verification code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-2xl tracking-[0.5em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="000000"
            />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {info && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-brand-600 hover:underline disabled:opacity-60"
          >
            {resending ? 'Resending…' : 'Resend code'}
          </button>
          <Link to="/login" className="text-gray-500 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
