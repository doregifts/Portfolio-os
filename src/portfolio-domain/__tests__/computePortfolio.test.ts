import { describe, it, expect } from 'vitest'
import { computeAllPositions, sumPatrimony } from '../computePortfolio'
import type { Asset, TransactionRow } from '../types'

const assetA: Asset = {
  id: 'asset-1', ticker: 'PETR4', name: 'Petrobras PN', exchange: 'B3',
  asset_class: 'stock', currency: 'BRL', country: 'BR', quote_symbol: 'PETR4.SAO',
}
const assetB: Asset = {
  id: 'asset-2', ticker: 'VALE3', name: 'Vale ON', exchange: 'B3',
  asset_class: 'stock', currency: 'BRL', country: 'BR', quote_symbol: 'VALE3.SAO',
}

describe('computeAllPositions', () => {
  it('agrupa transações por ativo e calcula posição de cada um', () => {
    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '100', unit_price: '20', fees: '0', taxes: '0' },
      { id: '2', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-2', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '50', unit_price: '60', fees: '0', taxes: '0' },
    ]
    const quotes = {
      'asset-1': { price: '25.00', fetchedAt: '2026-01-02T00:00:00Z' },
      'asset-2': { price: '55.00', fetchedAt: '2026-01-02T00:00:00Z' },
    }

    const positions = computeAllPositions(transactions, [assetA, assetB], quotes)

    expect(positions).toHaveLength(2)
    const petr = positions.find((p) => p.asset.ticker === 'PETR4')!
    expect(petr.quantity).toBe('100')
    expect(petr.totalCost).toBe('2000.00')
    expect(petr.marketValue).toBe('2500.00')
    expect(Number(petr.result)).toBeCloseTo(500, 2)

    const vale = positions.find((p) => p.asset.ticker === 'VALE3')!
    // Vale caiu de 60 pra 55 -> resultado negativo
    expect(Number(vale.result)).toBeLessThan(0)
  })

  it('omite posições zeradas (tudo vendido)', () => {
    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '10', unit_price: '20', fees: '0', taxes: '0' },
      { id: '2', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'SELL', trade_date: '2026-01-05', quantity: '10', unit_price: '25', fees: '0', taxes: '0' },
    ]
    const positions = computeAllPositions(transactions, [assetA], {})
    expect(positions).toHaveLength(0)
  })

  it('funciona sem cotação disponível (marketValue null, não quebra)', () => {
    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '10', unit_price: '20', fees: '0', taxes: '0' },
    ]
    const positions = computeAllPositions(transactions, [assetA], {})
    expect(positions[0].marketValue).toBeNull()
    expect(positions[0].result).toBeNull()
  })
})

describe('sumPatrimony', () => {
  it('soma custo e valor de mercado de todas as posições', () => {
    const positions = computeAllPositions(
      [
        { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '100', unit_price: '20', fees: '0', taxes: '0' },
        { id: '2', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-2', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '50', unit_price: '60', fees: '0', taxes: '0' },
      ],
      [assetA, assetB],
      { 'asset-1': { price: '25', fetchedAt: '' }, 'asset-2': { price: '55', fetchedAt: '' } }
    )
    const { totalCost, totalMarketValue, hasAllQuotes } = sumPatrimony(positions)
    expect(totalCost).toBe(5000) // 2000 + 3000
    expect(totalMarketValue).toBe(5250) // 2500 + 2750
    expect(hasAllQuotes).toBe(true)
  })

  it('sinaliza hasAllQuotes=false quando falta cotação de algum ativo', () => {
    const positions = computeAllPositions(
      [{ id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '10', unit_price: '20', fees: '0', taxes: '0' }],
      [assetA],
      {}
    )
    const { hasAllQuotes } = sumPatrimony(positions)
    expect(hasAllQuotes).toBe(false)
  })
})

describe('computeAllPositions — multi-moeda (Fase 9)', () => {
  const assetUS: Asset = {
    id: 'asset-us', ticker: 'AAPL', name: 'Apple Inc', exchange: 'NASDAQ',
    asset_class: 'stock', currency: 'USD', country: 'US', quote_symbol: 'AAPL',
  }

  it('converte custo e valor de mercado de ativo em USD para BRL usando a taxa de câmbio', () => {
    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-us', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '10', unit_price: '100', fees: '0', taxes: '0' },
    ]
    const quotes = { 'asset-us': { price: '120', fetchedAt: '2026-01-02' } }
    const fxRates = { USD: { rate: '5.00', fetchedAt: '2026-01-02' } }

    const positions = computeAllPositions(transactions, [assetUS], quotes, fxRates)
    const p = positions[0]

    expect(p.totalCost).toBe('1000.00') // em USD
    expect(p.totalCostBRL).toBe('5000.00') // 1000 * 5.00
    expect(p.marketValue).toBe('1200.00') // em USD
    expect(p.marketValueBRL).toBe('6000.00') // 1200 * 5.00
  })

  it('não converte quando falta taxa de câmbio (não inventa número)', () => {
    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-us', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '10', unit_price: '100', fees: '0', taxes: '0' },
    ]
    const positions = computeAllPositions(transactions, [assetUS], {}, {})
    expect(positions[0].totalCostBRL).toBeNull()
    expect(positions[0].fxRate).toBeNull()
  })

  it('sumPatrimony soma corretamente ativos BRL e USD convertidos juntos', () => {
    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '100', unit_price: '10', fees: '0', taxes: '0' }, // R$1000
      { id: '2', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-us', transaction_type: 'BUY', trade_date: '2026-01-01', quantity: '10', unit_price: '100', fees: '0', taxes: '0' }, // US$1000
    ]
    const positions = computeAllPositions(
      transactions,
      [assetA, assetUS],
      { 'asset-1': { price: '10', fetchedAt: '' }, 'asset-us': { price: '100', fetchedAt: '' } },
      { USD: { rate: '5', fetchedAt: '' } }
    )
    const { totalCost } = sumPatrimony(positions)
    expect(totalCost).toBe(1000 + 5000) // R$1000 (BRL) + US$1000*5 (convertido)
  })
})
