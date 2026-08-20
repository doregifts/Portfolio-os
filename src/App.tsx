import { useAuth } from './lib/useAuth'
import { AuthPage } from './app/pages/AuthPage'
import { DashboardPage } from './app/pages/DashboardPage'

export default function App() {
  const { session, loading, authError } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-ink/50 dark:text-paper/50">
        Carregando…
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-medium text-loss">Não foi possível conectar</p>
          <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-brand-600 dark:text-brass-soft hover:underline"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    )
  }

  return session ? <DashboardPage /> : <AuthPage />
}
