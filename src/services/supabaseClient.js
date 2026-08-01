import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vrcnhvpvygkjlfrdiffy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyY25odnB2eWdramxmcmRpZml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDg2MzUsImV4cCI6MjEwMTAyNDYzNX0.PDnzVx38nnJzyWlss3HsW0E2Tx4-9xSORVdksB7MvAg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
