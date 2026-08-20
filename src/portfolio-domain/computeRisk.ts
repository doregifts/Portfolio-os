import type { AssetPosition } from './computePortfolio'

export interface RiskSummary {
  /** Índice Herfindahl-Hirschman normalizado (0 = perfeitamente diversificado, 1 = tudo em um ativo). */
  concentrationIndex: number
  topPosition: { ticker: string; weight: number } | null
  /** Ativos que sozinhos representam mais de 25% da carteira (limiar informativo, não regra). */
  concentratedAssets: { ticker: string; weight: number }[]
}

/**
 * Métricas de concentração determinísticas — nunca uma "nota" de risco inventada.
 * Ver PROJECT_SPEC.md seção 46/117: sempre mostrar a metodologia, nunca chamar de definitivo.
 */
export function computeRisk(positions: AssetPosition[]): RiskSummary {
  const weights = positions.map((p) => ({
    ticker: p.asset.ticker,
    value: Number(p.marketValue ?? p.totalCost),
  }))
  const total = weights.reduce((sum, w) => sum + w.value, 0)

  if (total <= 0 || weights.length === 0) {
    return { concentrationIndex: 0, topPosition: null, concentratedAssets: [] }
  }

  const withWeight = weights.map((w) => ({ ticker: w.ticker, weight: w.value / total }))
  const hhi = withWeight.reduce((sum, w) => sum + w.weight * w.weight, 0)

  const sorted = [...withWeight].sort((a, b) => b.weight - a.weight)

  return {
    concentrationIndex: hhi,
    topPosition: sorted[0] ?? null,
    concentratedAssets: sorted.filter((w) => w.weight > 0.25),
  }
}
