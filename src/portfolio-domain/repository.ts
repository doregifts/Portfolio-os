import { supabase } from '../lib/supabase'
import type { Portfolio, Account, Asset, TransactionRow } from './types'

export async function ensureDefaultPortfolio(userId: string): Promise<Portfolio> {
  const existing = await supabase.from('portfolios').select('*').eq('user_id', userId).limit(1)
  if (existing.error) throw existing.error
  if (existing.data && existing.data.length > 0) return existing.data[0] as Portfolio

  const created = await supabase
    .from('portfolios')
    .insert({ user_id: userId, name: 'Minha Carteira', base_currency: 'BRL' })
    .select()
    .single()
  if (created.error) throw created.error
  return created.data as Portfolio
}

export async function ensureDefaultAccount(userId: string, portfolioId: string): Promise<Account> {
  const existing = await supabase.from('accounts').select('*').eq('portfolio_id', portfolioId).limit(1)
  if (existing.error) throw existing.error
  if (existing.data && existing.data.length > 0) return existing.data[0] as Account

  const created = await supabase
    .from('accounts')
    .insert({ portfolio_id: portfolioId, user_id: userId, name: 'Conta Principal', currency: 'BRL', account_type: 'brokerage' })
    .select()
    .single()
  if (created.error) throw created.error
  return created.data as Account
}

export async function findOrCreateAsset(input: {
  ticker: string
  name: string
  exchange: string
  assetClass: string
  currency: string
  country: string
  quoteSymbol?: string
}): Promise<Asset> {
  const existing = await supabase
    .from('assets')
    .select('*')
    .eq('ticker', input.ticker)
    .eq('exchange', input.exchange)
    .limit(1)
  if (existing.error) throw existing.error
  if (existing.data && existing.data.length > 0) return existing.data[0] as Asset

  const created = await supabase
    .from('assets')
    .insert({
      ticker: input.ticker,
      name: input.name,
      exchange: input.exchange,
      asset_class: input.assetClass,
      currency: input.currency,
      country: input.country,
      quote_symbol: input.quoteSymbol ?? null,
    })
    .select()
    .single()
  if (created.error) throw created.error
  return created.data as Asset
}

export async function listAssets(): Promise<Asset[]> {
  const { data, error } = await supabase.from('assets').select('*').order('ticker')
  if (error) throw error
  return (data ?? []) as Asset[]
}

export async function listTransactions(portfolioId: string): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .is('deleted_at', null)
    .order('trade_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as TransactionRow[]
}

export async function createTransaction(input: {
  userId: string
  portfolioId: string
  accountId: string
  assetId: string
  type: string
  date: string
  quantity: string
  unitPrice?: string
  fees?: string
  taxes?: string
}) {
  const { error } = await supabase.from('transactions').insert({
    user_id: input.userId,
    portfolio_id: input.portfolioId,
    account_id: input.accountId,
    asset_id: input.assetId,
    transaction_type: input.type,
    trade_date: input.date,
    quantity: input.quantity,
    unit_price: input.unitPrice ?? null,
    fees: input.fees ?? '0',
    taxes: input.taxes ?? '0',
  })
  if (error) throw error
}

export async function listAllocationTargets(portfolioId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('allocation_targets').select('*').eq('portfolio_id', portfolioId)
  if (error) throw error
  const map: Record<string, number> = {}
  for (const row of data ?? []) map[row.asset_id] = Number(row.target_weight)
  return map
}

export async function setAllocationTarget(userId: string, portfolioId: string, assetId: string, targetWeight: number) {
  const { error } = await supabase
    .from('allocation_targets')
    .upsert(
      { user_id: userId, portfolio_id: portfolioId, asset_id: assetId, target_weight: targetWeight, updated_at: new Date().toISOString() },
      { onConflict: 'portfolio_id,asset_id' }
    )
  if (error) throw error
}

export async function createTransactionsBulk(
  inputs: Array<{
    userId: string
    portfolioId: string
    accountId: string
    assetId: string
    type: string
    date: string
    quantity: string
    unitPrice?: string
    fees?: string
  }>
) {
  const { error } = await supabase.from('transactions').insert(
    inputs.map((input) => ({
      user_id: input.userId,
      portfolio_id: input.portfolioId,
      account_id: input.accountId,
      asset_id: input.assetId,
      transaction_type: input.type,
      trade_date: input.date,
      quantity: input.quantity,
      unit_price: input.unitPrice ?? null,
      fees: input.fees ?? '0',
      taxes: '0',
      source: 'csv_import',
    }))
  )
  if (error) throw error
}
