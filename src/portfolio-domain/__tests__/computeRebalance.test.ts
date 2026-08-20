import { describe, it, expect } from 'vitest'
import { computeRebalance } from '../computeRebalance'
import type { AssetPosition } from '../computePortfolio'

function pos(id: string, ticker: string, marketValue: number): AssetPosition {
  return {
    asset: { id, ticker, name: ticker, exchange: 'B3', asset_class: 'stock', currency: 'BRL', country: 'BR', quote_symbol: null },
    quantity: '1', averagePrice: '1', totalCost: String(marketValue),
    currentPrice: '1', marketValue: String(marketValue), result: '0', resultPercent: '0', quoteFetchedAt: null, fxRate: null, fxFetchedAt: null, totalCostBRL: null, marketValueBRL: null,
  }
}

describe('computeRebalance', () => {
  it('distribui o aporte proporcionalmente ao déficit dos ativos abaixo da meta', () => {
    // PETR4: 800 (80%), VALE3: 200 (20%). Meta: 50/50.
    // PETR4 está ACIMA da meta (não recebe nada), VALE3 está abaixo (recebe tudo).
    const positions = [pos('a1', 'PETR4', 800), pos('a2', 'VALE3', 200)]
    const targets = { a1: 0.5, a2: 0.5 }

    const rows = computeRebalance(positions, targets, 1000)

    const petr = rows.find((r) => r.ticker === 'PETR4')!
    const vale = rows.find((r) => r.ticker === 'VALE3')!

    expect(petr.suggestedContribution).toBe(0) // acima da meta, não recebe
    expect(vale.suggestedContribution).toBe(1000) // único abaixo da meta, recebe tudo
  })

  it('divide proporcionalmente quando mais de um ativo está abaixo da meta', () => {
    // A: 600 (60%), B: 200 (20%), C: 200 (20%). Meta: 33/33/34.
    const positions = [pos('a', 'A', 600), pos('b', 'B', 200), pos('c', 'C', 200)]
    const targets = { a: 0.33, b: 0.33, c: 0.34 }

    const rows = computeRebalance(positions, targets, 900)
    const a = rows.find((r) => r.ticker === 'A')!
    const b = rows.find((r) => r.ticker === 'B')!
    const c = rows.find((r) => r.ticker === 'C')!

    expect(a.suggestedContribution).toBe(0) // já acima da meta
    // B e C têm o mesmo déficit (0.13 cada aprox) -> dividem os 900 quase igualmente
    expect(b.suggestedContribution).toBeGreaterThan(0)
    expect(c.suggestedContribution).toBeGreaterThan(0)
    expect(b.suggestedContribution + c.suggestedContribution).toBeCloseTo(900, 1)
  })

  it('não sugere nada quando todos já estão na meta ou acima', () => {
    const positions = [pos('a', 'A', 500), pos('b', 'B', 500)]
    const targets = { a: 0.3, b: 0.3 } // ambos já acima da meta
    const rows = computeRebalance(positions, targets, 1000)
    expect(rows.every((r) => r.suggestedContribution === 0)).toBe(true)
  })
})
