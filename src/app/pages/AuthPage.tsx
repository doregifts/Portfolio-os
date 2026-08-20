import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setBusy(false)

    if (error) {
      setError(error.message)
      return
    }
    if (mode === 'signup') {
      setInfo('Conta criada. Verifique seu e-mail para confirmar, se exigido.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="receipt-line text-brand-600 dark:text-brass-soft uppercase tracking-wider mb-1">
            registro de patrimônio
          </p>
          <h1 className="num-display text-3xl text-brand-700 dark:text-paper">Portfolio OS</h1>
        </div>

        <div className="bg-white dark:bg-brand-900/40 rounded-2xl border border-hairline dark:border-hairline-dark p-8 space-y-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-ink/60 dark:text-paper/60">
            {mode === 'login' ? 'Entrar na sua conta' : 'Criar uma conta'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50 block mb-1.5" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-hairline dark:border-hairline-dark bg-transparent px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 ring-brass"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50 block mb-1.5" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-hairline dark:border-hairline-dark bg-transparent px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 ring-brass"
              />
            </div>

            {error && <p className="text-sm text-loss">{error}</p>}
            {info && <p className="text-sm text-gain">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand-600 text-white py-2.5 text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
            >
              {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-brand-600 dark:text-brass-soft hover:underline"
          >
            {mode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
