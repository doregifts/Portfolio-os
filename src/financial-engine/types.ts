// financial-engine é puro: sem React, sem Supabase, sem chamada de rede.
// Ver PROJECT_SPEC.md seções 5 e 6.

export type TransactionType =
  | 'BUY'
  | 'SELL'
  | 'DIVIDEND'
  | 'JCP'
  | 'BONUS'
  | 'SPLIT'
  | 'REVERSE_SPLIT'
  | 'FEE'
  | 'TAX'
  | 'CASH_DEPOSIT'
  | 'CASH_WITHDRAW'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'

export interface AssetTransaction {
  id: string
  type: TransactionType
  date: string // ISO date
  /** Quantidade da operação. Para SPLIT/REVERSE_SPLIT, é o fator (ex: 2 para split 2:1). */
  quantity: string
  /** Preço unitário, quando aplicável (BUY/SELL). String para não perder precisão na entrada. */
  unitPrice?: string
  fees?: string
  taxes?: string
}

export interface PositionResult {
  quantity: string
  averagePrice: string
  totalCost: string
}

export interface SellResult extends PositionResult {
  realizedProfit: string
  proceeds: string
}
