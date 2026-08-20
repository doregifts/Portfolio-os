import { supabase } from '../lib/supabase'

const SCHEMA_VERSION = 1

export async function exportBackup(portfolioId: string, userId: string) {
  const [portfolios, accounts, transactions] = await Promise.all([
    supabase.from('portfolios').select('*').eq('id', portfolioId),
    supabase.from('accounts').select('*').eq('portfolio_id', portfolioId),
    supabase.from('transactions').select('*').eq('portfolio_id', portfolioId).is('deleted_at', null),
  ])

  if (portfolios.error) throw portfolios.error
  if (accounts.error) throw accounts.error
  if (transactions.error) throw transactions.error

  // asset_id é referência a dado compartilhado — exportar os assets referenciados também,
  // pra que o backup seja autocontido e restaurável mesmo em outra instância.
  const assetIds = [...new Set((transactions.data ?? []).map((t) => t.asset_id))]
  const assets =
    assetIds.length > 0
      ? await supabase.from('assets').select('*').in('id', assetIds)
      : { data: [], error: null }
  if (assets.error) throw assets.error

  const payload = {
    schemaVersion: SCHEMA_VERSION,
    appVersion: '0.1.0-fase1',
    createdAt: new Date().toISOString(),
    userId,
    data: {
      portfolios: portfolios.data,
      accounts: accounts.data,
      assets: assets.data,
      transactions: transactions.data,
    },
  }

  return payload
}

export function downloadBackupFile(payload: unknown, filename = `portfolio-os-backup-${Date.now()}.json`) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
