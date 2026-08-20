export interface Portfolio {
  id: string
  name: string
  base_currency: string
}

export interface Account {
  id: string
  portfolio_id: string
  name: string
  currency: string
}

export interface Asset {
  id: string
  ticker: string
  name: string
  exchange: string | null
  asset_class: string
  currency: string
  country: string
  quote_symbol: string | null
}

export interface TransactionRow {
  id: string
  portfolio_id: string
  account_id: string
  asset_id: string
  transaction_type: string
  trade_date: string
  quantity: string
  unit_price: string | null
  fees: string
  taxes: string
}
