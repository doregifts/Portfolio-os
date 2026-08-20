import { createClient } from '@supabase/supabase-js'

// .trim() por segurança — é comum colar a URL/chave com espaço em branco extra
// ao configurar variáveis de ambiente manualmente pela interface do Netlify.
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

if (!url || !key) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não configuradas.'
  )
}

if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url)) {
  throw new Error(
    `VITE_SUPABASE_URL parece com formato inválido: "${url}". Esperado algo como https://xxxxx.supabase.co`
  )
}

export const supabase = createClient(url, key)
