import { computePosition } from '../financial-engine/positionEngine'
import type { AssetTransaction, TransactionType } from '../financial-engine/types'
import type { Asset, TransactionRow } from './types'

export interface AssetPosition {
  asset: Asset
  quantity: string
  averagePrice: string
  totalCost: string // na moeda original do ativo
  currentPrice: string | null // na moeda original do ativo
  marketValue: string | null // na moeda original do ativo
  result: string | null // na moeda original do ativo
  resultPercent: string | null
  quoteFetchedAt: string | null
  // Conversão para BRL (moeda base do usuário). Ver PROJECT_SPEC.md seção 28:
  // sempre mostrar valor original + convertido, nunca só um dos dois.
  fxRate: string | null
  fxFetchedAt: string | null
  totalCostBRL: string | null
  marketValueBRL: string | null
}

/** Agrupa transações por ativo e roda o financial-engine em cada grupo. */
export function computeAllPositions(
  transactions: TransactionRow[],
  assets: Asset[],
  quotes: Record<string, { price: string; fetchedAt: string }>,
  fxRates: Record<string, { rate: string; fetchedAt: string }> = {}
): AssetPosition[] {
  const byAsset = new Map<string, TransactionRow[]>()
  for (const tx of transactions) {
    const list = byAsset.get(tx.asset_id) ?? []
    list.push(tx)
    byAsset.set(tx.asset_id, list)
  }

  const positions: AssetPosition[] = []

  for (const [assetId, txs] of byAsset.entries()) {
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) continue

    const engineTxs: AssetTransaction[] = txs
      .sort((a, b) => a.trade_date.localeCompare(b.trade_date))
      .map((tx) => ({
        id: tx.id,
        type: tx.transaction_type as TransactionType,
        date: tx.trade_date,
        quantity: tx.quantity,
        unitPrice: tx.unit_price ?? undefined,
        fees: tx.fees,
        taxes: tx.taxes,
      }))

    const result = computePosition(engineTxs)

    // Não mostrar posições zeradas (tudo vendido) na carteira ativa.
    if (result.quantity.isZero()) continue

    const quote = quotes[assetId]
    const currentPrice = quote?.price ?? null
    const marketValue = currentPrice ? result.quantity.times(currentPrice).toFixed(2) : null
    const totalCost = result.totalCost.toFixed(2)
    const resultValue = marketValue ? (Number(marketValue) - Number(totalCost)).toFixed(2) : null
    const resultPercent =
      resultValue && !result.totalCost.isZero() ? ((Number(resultValue) / Number(totalCost)) * 100).toFixed(2) : null

    const isForeign = asset.currency !== 'BRL'
    const fx = isForeign ? fxRates[asset.currency] : { rate: '1', fetchedAt: '' }
    const fxRate = fx?.rate ?? null
    const totalCostBRL = fxRate ? (Number(totalCost) * Number(fxRate)).toFixed(2) : null
    const marketValueBRL = fxRate && marketValue ? (Number(marketValue) * Number(fxRate)).toFixed(2) : null

    positions.push({
      asset,
      quantity: result.quantity.toString(),
      averagePrice: result.averagePrice.toFixed(2),
      totalCost,
      currentPrice,
      marketValue,
      result: resultValue,
      resultPercent,
      quoteFetchedAt: quote?.fetchedAt ?? null,
      fxRate,
      fxFetchedAt: isForeign ? fx?.fetchedAt ?? null : null,
      totalCostBRL,
      marketValueBRL,
    })
  }

  return positions
}

export function sumPatrimony(positions: AssetPosition[]) {
  let totalCost = 0
  let totalMarketValue = 0
  let hasAllQuotes = true
  let hasAllFx = true

  for (const p of positions) {
    const isForeign = p.asset.currency !== 'BRL'

    if (isForeign) {
      if (p.totalCostBRL) totalCost += Number(p.totalCostBRL)
      else hasAllFx = false
      if (p.marketValueBRL) totalMarketValue += Number(p.marketValueBRL)
      else if (p.marketValue) hasAllFx = false
    } else {
      totalCost += Number(p.totalCost)
      if (p.marketValue) totalMarketValue += Number(p.marketValue)
    }

    if (!p.marketValue) hasAllQuotes = false
  }

  return { totalCost, totalMarketValue, hasAllQuotes, hasAllFx }
}
