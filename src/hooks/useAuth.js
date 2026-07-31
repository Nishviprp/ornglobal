import { createContext, useContext, useEffect, useState, useCallback, createElement } from 'react'
import {
  getSession,
  onAuthStateChange,
  getProfile,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
} from '../services/authService'
import { setLocal, getLocal } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(() => getLocal('profile'))
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    try {
      const p = await getProfile(userId)
      setProfile(p)
      setLocal('profile', p)
      if (p?.hospital_id) setLocal('lastHospitalId', p.hospital_id)
    } catch (err) {
      console.error('Failed to load profile', err)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    getSession().then((s) => {
      if (!mounted) return
      setSession(s)
      if (s?.user) loadProfile(s.user.id)
      setLoading(false)
    })

    const subscription = onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) {
        loadProfile(s.user.id)
      } else {
        setProfile(null)
        setLocal('profile', null)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [loadProfile])

  const login = useCallback(async (email, password) => {
    const data = await signInRequest({ email, password })
    setSession(data.session)
    if (data.session?.user) await loadProfile(data.session.user.id)
    return data
  }, [loadProfile])

  const register = useCallback(async (payload) => signUpRequest(payload), [])

  const logout = useCallback(async () => {
    await signOutRequest()
    setSession(null)
    setProfile(null)
    setLocal('profile', null)
  }, [])

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    isAuthenticated: !!session,
    login,
    register,
    logout,
    refreshProfile: () => session?.user && loadProfile(session.user.id),
  }

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
