import { useAuth } from './lib/useAuth'
import { AuthPage } from './app/pages/AuthPage'
import { DashboardPage } from './app/pages/DashboardPage'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">
        Carregando...
      </div>
    )
  }

  return session ? <DashboardPage /> : <AuthPage />
}
