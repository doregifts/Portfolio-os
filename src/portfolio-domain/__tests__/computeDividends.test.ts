import { describe, it, expect, vi, afterEach } from 'vitest'
import { computeDividends } from '../computeDividends'
import type { Asset, TransactionRow } from '../types'

const assetA: Asset = {
  id: 'asset-1', ticker: 'PETR4', name: 'Petrobras PN', exchange: 'B3',
  asset_class: 'stock', currency: 'BRL', country: 'BR', quote_symbol: 'PETR4.SAO',
}

afterEach(() => vi.useRealTimers())

describe('computeDividends', () => {
  it('soma proventos por mês, ano e desde o início, sem misturar tipos', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T12:00:00Z'))

    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'DIVIDEND', trade_date: '2026-08-05', quantity: '1', unit_price: '150', fees: '0', taxes: '0' },
      { id: '2', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'JCP', trade_date: '2026-07-01', quantity: '1', unit_price: '80', fees: '0', taxes: '0' },
      { id: '3', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'DIVIDEND', trade_date: '2025-01-01', quantity: '1', unit_price: '50', fees: '0', taxes: '0' },
      // BUY não deve contar como provento
      { id: '4', portfolio_id: 'p1', account_id: 'a1', asset_id: 'asset-1', transaction_type: 'BUY', trade_date: '2026-08-10', quantity: '10', unit_price: '20', fees: '0', taxes: '0' },
    ]

    const result = computeDividends(transactions, [assetA])

    expect(result.thisMonth).toBe(150) // só o de agosto/2026
    expect(result.thisYear).toBe(230) // 150 + 80, ambos em 2026
    expect(result.sinceInception).toBe(280) // 150 + 80 + 50
    expect(result.events).toHaveLength(3) // BUY não entra
  })

  it('retorna zeros quando não há proventos', () => {
    const result = computeDividends([], [assetA])
    expect(result.thisMonth).toBe(0)
    expect(result.thisYear).toBe(0)
    expect(result.sinceInception).toBe(0)
    expect(result.events).toHaveLength(0)
  })
})
