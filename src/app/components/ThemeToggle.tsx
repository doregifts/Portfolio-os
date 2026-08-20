import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../lib/useTheme'

const order = ['light', 'dark', 'system'] as const
const icons = { light: Sun, dark: Moon, system: Monitor }
const labels = { light: 'Claro', dark: 'Escuro', system: 'Sistema' }

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = icons[theme]

  function cycle() {
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }

  return (
    <button
      onClick={cycle}
      title={`Tema: ${labels[theme]} (toque para trocar)`}
      className="p-1.5 rounded-lg text-ink/50 dark:text-paper/50 hover:bg-brand-50 dark:hover:bg-brand-900/40 transition shrink-0"
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  )
}
