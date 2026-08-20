import Papa from 'papaparse'
import type { TransactionRow } from './types'

// Formato esperado do CSV (cabeçalho obrigatório):
// data,ticker,tipo,quantidade,preco,taxas
// 2026-01-15,PETR4,BUY,100,20.50,5.90
const VALID_TYPES = ['BUY', 'SELL', 'DIVIDEND', 'JCP', 'BONUS', 'SPLIT', 'REVERSE_SPLIT']

export interface ParsedRow {
  rowNumber: number
  raw: Record<string, string>
  date: string
  ticker: string
  type: string
  quantity: string
  unitPrice: string
  fees: string
  fingerprint: string
  status: 'valid' | 'duplicate' | 'invalid'
  errors: string[]
}

export interface ImportPreview {
  rows: ParsedRow[]
  validCount: number
  duplicateCount: number
  invalidCount: number
}

function makeFingerprint(date: string, ticker: string, type: string, quantity: string, unitPrice: string) {
  return `${date}|${ticker}|${type}|${quantity}|${unitPrice}`
}

/**
 * Faz o parsing do CSV e valida cada linha, mas NUNCA importa direto — apenas
 * monta o preview. A confirmação é um passo separado e explícito do usuário.
 * Ver PROJECT_SPEC.md seção 50-51: nunca importar sem preview, idempotência via fingerprint.
 */
export function parseTransactionsCsv(csvText: string, existingTransactions: TransactionRow[]): ImportPreview {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  const existingFingerprints = new Set(
    existingTransactions.map((t) =>
      makeFingerprint(t.trade_date, '', t.transaction_type, t.quantity, t.unit_price ?? '')
    )
  )
  // fingerprint de existentes não tem ticker (não temos join com assets aqui) — comparação
  // é por data+tipo+quantidade+preço, suficiente para o caso comum de reimportar o mesmo arquivo.

  const rows: ParsedRow[] = []
  const seenInFile = new Set<string>()

  parsed.data.forEach((raw, idx) => {
    const errors: string[] = []
    const date = (raw.data ?? '').trim()
    const ticker = (raw.ticker ?? '').trim().toUpperCase()
    const type = (raw.tipo ?? '').trim().toUpperCase()
    const quantity = (raw.quantidade ?? '').trim()
    const unitPrice = (raw.preco ?? raw['preço'] ?? '').trim()
    const fees = (raw.taxas ?? '0').trim()

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push('data inválida (use AAAA-MM-DD)')
    } else {
      // O regex só confere o formato — confere também se a data existe de verdade
      // (evita aceitar "2026-13-99", por exemplo).
      const [y, m, d] = date.split('-').map(Number)
      const parsedDate = new Date(Date.UTC(y, m - 1, d))
      const isRealDate =
        parsedDate.getUTCFullYear() === y && parsedDate.getUTCMonth() === m - 1 && parsedDate.getUTCDate() === d
      if (!isRealDate) errors.push('data inválida (use AAAA-MM-DD)')
    }
    if (!ticker) errors.push('ticker vazio')
    if (!VALID_TYPES.includes(type)) errors.push(`tipo desconhecido: "${type}"`)
    if (!quantity || isNaN(Number(quantity))) errors.push('quantidade inválida')
    if (type !== 'BONUS' && type !== 'SPLIT' && type !== 'REVERSE_SPLIT' && (!unitPrice || isNaN(Number(unitPrice)))) {
      errors.push('preço inválido')
    }

    const fingerprint = makeFingerprint(date, ticker, type, quantity, unitPrice)
    const isDuplicateInDb = existingFingerprints.has(makeFingerprint(date, '', type, quantity, unitPrice))
    const isDuplicateInFile = seenInFile.has(fingerprint)
    seenInFile.add(fingerprint)

    let status: ParsedRow['status'] = 'valid'
    if (errors.length > 0) status = 'invalid'
    else if (isDuplicateInDb || isDuplicateInFile) status = 'duplicate'

    rows.push({ rowNumber: idx + 2, raw, date, ticker, type, quantity, unitPrice, fees, fingerprint, status, errors })
  })

  return {
    rows,
    validCount: rows.filter((r) => r.status === 'valid').length,
    duplicateCount: rows.filter((r) => r.status === 'duplicate').length,
    invalidCount: rows.filter((r) => r.status === 'invalid').length,
  }
}
