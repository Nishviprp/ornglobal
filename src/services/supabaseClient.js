import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://geejvideazforqezqnqr.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlZWp2aWRlYXpmb3JxZXF6bnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTA5ODEsImV4cCI6MjEwMTM2Njk4MX0.vWqEJE3Q56144eAv-eCYwFGU7XV3mIB3D3hO44F0zRc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
