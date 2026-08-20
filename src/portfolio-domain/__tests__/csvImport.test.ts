import { describe, it, expect } from 'vitest'
import { parseTransactionsCsv } from '../csvImport'
import type { TransactionRow } from '../types'

describe('parseTransactionsCsv', () => {
  it('valida linhas corretas como "valid"', () => {
    const csv = `data,ticker,tipo,quantidade,preco,taxas
2026-01-15,PETR4,BUY,100,20.50,5.90
2026-02-01,VALE3,SELL,50,60.00,3.00`

    const result = parseTransactionsCsv(csv, [])
    expect(result.validCount).toBe(2)
    expect(result.invalidCount).toBe(0)
    expect(result.duplicateCount).toBe(0)
  })

  it('marca linhas com dados inválidos e explica o motivo', () => {
    const csv = `data,ticker,tipo,quantidade,preco,taxas
2026-13-99,PETR4,BUY,100,20.50,0
2026-01-15,,BUY,100,20.50,0
2026-01-15,PETR4,COMPRA,100,20.50,0
2026-01-15,PETR4,BUY,abc,20.50,0`

    const result = parseTransactionsCsv(csv, [])
    expect(result.invalidCount).toBe(4)
    expect(result.rows[0].errors).toContain('data inválida (use AAAA-MM-DD)')
    expect(result.rows[1].errors).toContain('ticker vazio')
    expect(result.rows[2].errors[0]).toMatch(/tipo desconhecido/)
    expect(result.rows[3].errors).toContain('quantidade inválida')
  })

  it('detecta duplicata DENTRO do próprio arquivo', () => {
    const csv = `data,ticker,tipo,quantidade,preco,taxas
2026-01-15,PETR4,BUY,100,20.50,0
2026-01-15,PETR4,BUY,100,20.50,0`

    const result = parseTransactionsCsv(csv, [])
    expect(result.validCount).toBe(1)
    expect(result.duplicateCount).toBe(1)
  })

  it('detecta duplicata contra transações JÁ existentes no banco (idempotência)', () => {
    const existing: TransactionRow[] = [
      { id: '1', portfolio_id: 'p1', account_id: 'a1', asset_id: 'a1', transaction_type: 'BUY', trade_date: '2026-01-15', quantity: '100', unit_price: '20.50', fees: '0', taxes: '0' },
    ]
    const csv = `data,ticker,tipo,quantidade,preco,taxas
2026-01-15,PETR4,BUY,100,20.50,0`

    const result = parseTransactionsCsv(csv, existing)
    expect(result.duplicateCount).toBe(1)
    expect(result.validCount).toBe(0)
  })

  it('não exige preço para SPLIT/BONUS/REVERSE_SPLIT', () => {
    const csv = `data,ticker,tipo,quantidade,preco,taxas
2026-01-15,PETR4,SPLIT,2,,0
2026-01-16,PETR4,BONUS,10,,0`

    const result = parseTransactionsCsv(csv, [])
    expect(result.validCount).toBe(2)
  })
})
