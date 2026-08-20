export interface Quote {
  symbol: string
  price: string
  previousClose: string
  changePercent: string
  latestTradingDay: string
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote | null>
}
