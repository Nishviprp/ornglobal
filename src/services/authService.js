import { supabase } from './supabaseClient'

export async function signUp({ email, password, firstName, lastName, hospitalId, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        hospital_id: hospitalId || null,
        role: role || 'nurse',
      },
    },
  })
  if (error) throw error
  return data
}

export async function verifySignupOtp({ email, token }) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })
  if (error) throw error
  return data
}

export async function resendSignupOtp({ email }) {
  const { data, error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return data.subscription
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, hospitals(name, city, country)')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listHospitals() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function addHospital(name, city, country) {
  const { data, error } = await supabase
    .from('hospitals')
    .insert({ name, city, country })
    .select()
    .single()
  if (error) throw error
  return data
}
