import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { computePosition } from '../positionEngine'
import type { AssetTransaction } from '../types'

function tx(partial: Partial<AssetTransaction> & Pick<AssetTransaction, 'id' | 'type' | 'date' | 'quantity'>): AssetTransaction {
  return partial
}

describe('computePosition — compras e preço médio', () => {
  it('calcula PM corretamente após duas compras (exemplo do PROJECT_SPEC)', () => {
    const transactions: AssetTransaction[] = [
      tx({ id: '1', type: 'BUY', date: '2026-01-01', quantity: '100', unitPrice: '20' }),
      tx({ id: '2', type: 'BUY', date: '2026-01-02', quantity: '50', unitPrice: '30' }),
    ]

    const result = computePosition(transactions)

    expect(result.quantity.toString()).toBe('150')
    expect(result.totalCost.toString()).toBe('3500')
    // 3500 / 150 = 23.333... — não deve ter sido arredondado durante o cálculo
    expect(result.averagePrice.toFixed(10)).toBe('23.3333333333')
  })

  it('inclui fees e taxes no custo de aquisição', () => {
    const transactions: AssetTransaction[] = [
      tx({ id: '1', type: 'BUY', date: '2026-01-01', quantity: '10', unitPrice: '100', fees: '5', taxes: '2' }),
    ]
    const result = computePosition(transactions)
    expect(result.totalCost.toString()).toBe('1007') // 10*100 + 5 + 2
  })
})

describe('computePosition — venda parcial', () => {
  it('preserva o PM da posição restante e calcula lucro realizado', () => {
    const transactions: AssetTransaction[] = [
      tx({ id: '1', type: 'BUY', date: '2026-01-01', quantity: '150', unitPrice: '23.333333333333333333' }),
      tx({ id: '2', type: 'SELL', date: '2026-02-01', quantity: '50', unitPrice: '40' }),
    ]

    const result = computePosition(transactions)

    expect(result.quantity.toString()).toBe('100')
    // PM não deve mudar após venda parcial
    const pmBefore = new Decimal('23.333333333333333333')
    expect(result.averagePrice.toFixed(6)).toBe(pmBefore.toFixed(6))

    expect(result.realizedEvents).toHaveLength(1)
    const sale = result.realizedEvents[0]
    // proceeds = 50*40 = 2000; costBasis = 50 * PM
    expect(sale.proceeds.toString()).toBe('2000')
    expect(sale.costBasis.toFixed(6)).toBe(pmBefore.times(50).toFixed(6))
    expect(sale.realizedProfit.toFixed(6)).toBe(
      new Decimal('2000').minus(pmBasis(pmBefore)).toFixed(6)
    )

    function pmBasis(pm: Decimal) {
      return pm.times(50)
    }
  })

  it('lança erro ao tentar vender mais do que a posição atual', () => {
    const transactions: AssetTransaction[] = [
      tx({ id: '1', type: 'BUY', date: '2026-01-01', quantity: '10', unitPrice: '10' }),
      tx({ id: '2', type: 'SELL', date: '2026-01-02', quantity: '20', unitPrice: '10' }),
    ]
    expect(() => computePosition(transactions)).toThrow()
  })
})

describe('computePosition — split e grupamento (invariante de custo total)', () => {
  it('split 2:1 dobra a quantidade, reduz o PM à metade, custo total inalterado', () => {
    const transactions: AssetTransaction[] = [
      tx({ id: '1', type: 'BUY', date: '2026-01-01', quantity: '100', unitPrice: '20' }),
    ]
    const before = computePosition(transactions)

    const afterSplit = computePosition([
      ...transactions,
      tx({ id: '2', type: 'SPLIT', date: '2026-02-01', quantity: '2' }),
    ])

    expect(afterSplit.quantity.toString()).toBe('200')
    expect(afterSplit.totalCost.toString()).toBe(before.totalCost.toString()) // invariante
    expect(afterSplit.averagePrice.toString()).toBe(before.averagePrice.dividedBy(2).toString())
  })

  it('grupamento 1:10 divide a quantidade por 10, custo total inalterado', () => {
    const transactions: AssetTransaction[] = [
      tx({ id: '1', type: 'BUY', date: '2026-01-01', quantity: '1000', unitPrice: '5' }),
      tx({ id: '2', type: 'REVERSE_SPLIT', date: '2026-02-01', quantity: '10' }),
    ]
    const result = computePosition(transactions)
    expect(result.quantity.toString()).toBe('100')
    expect(result.totalCost.toString()).toBe('5000') // inalterado
  })
})

describe('computePosition — sequência longa (invariante de quantidade)', () => {
  it('mantém a invariante quantity = buys + bonuses - sells através de eventos mistos', () => {
    const transactions: AssetTransaction[] = [
      tx({ id: '1', type: 'BUY', date: '2026-01-01', quantity: '100', unitPrice: '10' }),
      tx({ id: '2', type: 'BUY', date: '2026-01-05', quantity: '50', unitPrice: '12' }),
      tx({ id: '3', type: 'SELL', date: '2026-01-10', quantity: '30', unitPrice: '15' }),
      tx({ id: '4', type: 'BONUS', date: '2026-01-15', quantity: '12' }), // ex: bonificação de 10%
      tx({ id: '5', type: 'SPLIT', date: '2026-01-20', quantity: '2' }),
      tx({ id: '6', type: 'SELL', date: '2026-01-25', quantity: '40', unitPrice: '8' }),
      tx({ id: '7', type: 'DIVIDEND', date: '2026-01-28', quantity: '0' }), // não afeta quantidade
    ]

    const result = computePosition(transactions)

    // Cálculo manual passo a passo:
    // buy 100 -> 100
    // buy 50 -> 150
    // sell 30 -> 120
    // bonus 12 -> 132
    // split x2 -> 264
    // sell 40 -> 224
    expect(result.quantity.toString()).toBe('224')
    expect(result.realizedEvents).toHaveLength(2)
  })

  it('nunca perde precisão binária de float em sequência longa', () => {
    // Sequência clássica que quebra float (0.1 + 0.2 !== 0.3 em JS puro)
    const transactions: AssetTransaction[] = [
      tx({ id: '1', type: 'BUY', date: '2026-01-01', quantity: '0.1', unitPrice: '10' }),
      tx({ id: '2', type: 'BUY', date: '2026-01-02', quantity: '0.2', unitPrice: '10' }),
    ]
    const result = computePosition(transactions)
    expect(result.quantity.toString()).toBe('0.3')
  })
})
