import { computeXIRR } from '../financial-engine/xirr'
import type { CashFlow } from '../financial-engine/xirr'
import type { TransactionRow } from './types'

export interface PerformanceResult {
  xirr: number | null // taxa anualizada (ex: 0.15 = 15% a.a.)
  simpleReturn: number | null // (valor atual - investido) / investido, sem considerar tempo
  totalInvested: number
  currentValue: number
}

/**
 * Monta os fluxos de caixa do investidor (compras = saída, vendas/proventos = entrada,
 * valor de mercado atual = entrada final "como se vendesse hoje") e calcula XIRR.
 *
 * Nota: isto é retorno MONEY-WEIGHTED (pondera pelo tamanho e timing dos aportes).
 * TWR (time-weighted) fica fora desta fase — exige snapshots periódicos de valor da
 * carteira que ainda não existem (PROJECT_SPEC.md seção 75), e um TWR aproximado sem
 * esse histórico seria um número inventado, não calculado.
 */
export function computePerformance(transactions: TransactionRow[], currentMarketValue: number): PerformanceResult {
  const flows: CashFlow[] = []
  let totalInvested = 0
  let totalDivested = 0

  for (const tx of transactions) {
    const date = new Date(tx.trade_date + 'T00:00:00')
    const qty = Number(tx.quantity)
    const price = Number(tx.unit_price ?? 0)
    const fees = Number(tx.fees ?? 0)
    const taxes = Number(tx.taxes ?? 0)

    if (tx.transaction_type === 'BUY') {
      const amount = qty * price + fees + taxes
      flows.push({ date, amount: -amount })
      totalInvested += amount
    } else if (tx.transaction_type === 'SELL') {
      const amount = qty * price - fees - taxes
      flows.push({ date, amount })
      totalDivested += amount
    } else if (tx.transaction_type === 'DIVIDEND' || tx.transaction_type === 'JCP') {
      const amount = qty * price
      flows.push({ date, amount })
      totalDivested += amount
    }
  }

  if (currentMarketValue > 0) {
    flows.push({ date: new Date(), amount: currentMarketValue })
  }

  const xirr = computeXIRR(flows)
  const netInvested = totalInvested - totalDivested
  const simpleReturn = netInvested > 0 ? (currentMarketValue - netInvested) / netInvested : null

  return { xirr, simpleReturn, totalInvested, currentValue: currentMarketValue }
}
