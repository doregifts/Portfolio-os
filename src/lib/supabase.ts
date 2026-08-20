import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não configuradas (.env)'
  )
}

export const supabase = createClient(url, key)
