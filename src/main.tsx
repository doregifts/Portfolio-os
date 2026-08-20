import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const rootEl = document.getElementById('root')!

// Se App.tsx (ou qualquer import dele, como o cliente Supabase) falhar ao
// inicializar, nunca deixar a tela em branco sem explicação — foi exatamente
// isso que causou confusão nas primeiras tentativas de deploy.
try {
  const { default: App } = await import('./App.tsx')
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  console.error('Falha ao inicializar o app:', err)
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:sans-serif;text-align:center;color:#17231d;background:#f6f5f1">
      <div>
        <p style="font-weight:600;margin-bottom:8px">Não foi possível carregar o Portfolio OS</p>
        <p style="font-size:14px;opacity:0.7">${err instanceof Error ? err.message : 'Erro desconhecido na inicialização.'}</p>
      </div>
    </div>
  `
}
