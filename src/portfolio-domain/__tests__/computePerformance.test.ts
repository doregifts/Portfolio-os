import { describe, it, expect } from 'vitest'
import { computePerformance } from '../computePerformance'
import type { TransactionRow } from '../types'

describe('computePerformance', () => {
  it('calcula XIRR e retorno simples a partir de compra + valor de mercado atual', () => {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const dateStr = oneYearAgo.toISOString().slice(0, 10)

    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'a1', transaction_type: 'BUY', trade_date: dateStr, quantity: '100', unit_price: '10', fees: '0', taxes: '0' },
    ]

    // Investiu 1000 há 1 ano, vale 1200 hoje -> XIRR próximo de 20% a.a.
    const result = computePerformance(transactions, 1200)

    expect(result.totalInvested).toBe(1000)
    expect(result.simpleReturn).toBeCloseTo(0.2, 2)
    expect(result.xirr).not.toBeNull()
    expect(result.xirr!).toBeCloseTo(0.2, 1)
  })

  it('retorna simpleReturn null quando não há capital líquido investido', () => {
    const result = computePerformance([], 0)
    expect(result.simpleReturn).toBeNull()
    expect(result.xirr).toBeNull()
  })

  it('inclui proventos como entrada de caixa (não deveriam inflar o "investido")', () => {
    const transactions: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'a1', transaction_type: 'BUY', trade_date: '2025-01-01', quantity: '100', unit_price: '10', fees: '0', taxes: '0' },
      { id: '2', portfolio_id: 'p1', account_id: 'a1', asset_id: 'a1', transaction_type: 'DIVIDEND', trade_date: '2025-06-01', quantity: '1', unit_price: '50', fees: '0', taxes: '0' },
    ]
    const result = computePerformance(transactions, 1100)
    expect(result.totalInvested).toBe(1000) // dividendo não conta como "investido"
  })
})
