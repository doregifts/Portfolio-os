import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Nunca deixar a tela presa em "carregando" pra sempre: qualquer erro (rede,
    // config errada, timeout) precisa terminar o loading e mostrar o motivo.
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setAuthError('Tempo esgotado ao conectar. Verifique sua conexão e recarregue a página.')
        setLoading(false)
      }
    }, 10000)

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setAuthError(error.message)
        } else {
          setSession(data.session)
        }
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setAuthError(err instanceof Error ? err.message : 'Erro ao conectar com o servidor.')
        setLoading(false)
      })
      .finally(() => clearTimeout(timeout))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      cancelled = true
      clearTimeout(timeout)
      listener.subscription.unsubscribe()
    }
  }, [])

  return {
    session,
    user: session?.user ?? null,
    loading,
    authError,
    signOut: () => supabase.auth.signOut(),
  }
}
