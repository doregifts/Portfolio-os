import type { AssetPosition } from './computePortfolio'

export interface RebalanceRow {
  ticker: string
  assetId: string
  currentWeight: number
  targetWeight: number
  diff: number // targetWeight - currentWeight
  suggestedContribution: number // quanto do aporte simulado deveria ir pra esse ativo
}

/**
 * Simulador de aporte (PROJECT_SPEC.md seção 45): dado um valor a aportar, distribui
 * proporcionalmente aos ativos que estão ABAIXO da meta, para aproximar a carteira do
 * alvo SEM VENDER nada. Puramente matemático — nunca apresentado como recomendação.
 */
export function computeRebalance(
  positions: AssetPosition[],
  targets: Record<string, number>,
  contributionAmount: number
): RebalanceRow[] {
  const values = positions.map((p) => ({
    ticker: p.asset.ticker,
    assetId: p.asset.id,
    value: Number(p.marketValue ?? p.totalCost),
  }))
  const total = values.reduce((sum, v) => sum + v.value, 0)
  if (total <= 0) return []

  const rows: RebalanceRow[] = values.map((v) => {
    const currentWeight = v.value / total
    const targetWeight = targets[v.assetId] ?? 0
    return { ticker: v.ticker, assetId: v.assetId, currentWeight, targetWeight, diff: targetWeight - currentWeight, suggestedContribution: 0 }
  })

  // Distribui o aporte proporcionalmente ao "déficit" (targetWeight - currentWeight) dos
  // ativos abaixo da meta. Ativos acima da meta não recebem nada (não vendemos).
  const belowTarget = rows.filter((r) => r.diff > 0)
  const totalDeficit = belowTarget.reduce((sum, r) => sum + r.diff, 0)

  if (totalDeficit > 0 && contributionAmount > 0) {
    for (const row of belowTarget) {
      row.suggestedContribution = (row.diff / totalDeficit) * contributionAmount
    }
  }

  return rows.sort((a, b) => b.diff - a.diff)
}
