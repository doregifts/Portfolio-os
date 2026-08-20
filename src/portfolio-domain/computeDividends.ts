import type { Asset, TransactionRow } from './types'

export interface DividendEvent {
  id: string
  assetTicker: string
  type: 'DIVIDEND' | 'JCP'
  date: string
  amount: number
}

export interface DividendsSummary {
  events: DividendEvent[]
  thisMonth: number
  thisYear: number
  sinceInception: number
}

/** Soma proventos efetivamente REGISTRADOS pelo usuário (não estimados/anunciados —
 *  ver PROJECT_SPEC.md seção 37: nunca misturar recebido com estimado). */
export function computeDividends(transactions: TransactionRow[], assets: Asset[]): DividendsSummary {
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM
  const currentYear = now.toISOString().slice(0, 4)

  const events: DividendEvent[] = transactions
    .filter((t) => t.transaction_type === 'DIVIDEND' || t.transaction_type === 'JCP')
    .map((t) => {
      const asset = assets.find((a) => a.id === t.asset_id)
      return {
        id: t.id,
        assetTicker: asset?.ticker ?? '—',
        type: t.transaction_type as 'DIVIDEND' | 'JCP',
        date: t.trade_date,
        amount: Number(t.unit_price ?? 0) * Number(t.quantity),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  let thisMonth = 0
  let thisYear = 0
  let sinceInception = 0

  for (const e of events) {
    sinceInception += e.amount
    if (e.date.slice(0, 4) === currentYear) thisYear += e.amount
    if (e.date.slice(0, 7) === currentMonth) thisMonth += e.amount
  }

  return { events, thisMonth, thisYear, sinceInception }
}
