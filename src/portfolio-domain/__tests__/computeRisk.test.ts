import { describe, it, expect } from 'vitest'
import { computeRisk } from '../computeRisk'
import type { AssetPosition } from '../computePortfolio'

function pos(ticker: string, marketValue: number): AssetPosition {
  return {
    asset: { id: ticker, ticker, name: ticker, exchange: 'B3', asset_class: 'stock', currency: 'BRL', country: 'BR', quote_symbol: null },
    quantity: '1', averagePrice: '1', totalCost: String(marketValue),
    currentPrice: '1', marketValue: String(marketValue), result: '0', resultPercent: '0', quoteFetchedAt: null, fxRate: null, fxFetchedAt: null, totalCostBRL: null, marketValueBRL: null,
  }
}

describe('computeRisk', () => {
  it('HHI = 1 quando 100% concentrado em um único ativo', () => {
    const risk = computeRisk([pos('PETR4', 1000)])
    expect(risk.concentrationIndex).toBe(1)
    expect(risk.topPosition?.ticker).toBe('PETR4')
    expect(risk.concentratedAssets).toHaveLength(1)
  })

  it('HHI = 0.5 com dois ativos de peso igual (50/50)', () => {
    const risk = computeRisk([pos('PETR4', 500), pos('VALE3', 500)])
    expect(risk.concentrationIndex).toBeCloseTo(0.5, 5)
    expect(risk.concentratedAssets).toHaveLength(2) // 50% cada, ambos acima do limiar de 25%
  })

  it('HHI = 0.25 com quatro ativos de peso igual (25% cada)', () => {
    const risk = computeRisk([pos('A', 250), pos('B', 250), pos('C', 250), pos('D', 250)])
    expect(risk.concentrationIndex).toBeCloseTo(0.25, 5)
  })

  it('retorna vazio quando não há posições', () => {
    const risk = computeRisk([])
    expect(risk.concentrationIndex).toBe(0)
    expect(risk.topPosition).toBeNull()
  })
})
