import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../lib/useAuth'
import {
  ensureDefaultPortfolio,
  ensureDefaultAccount,
  listAssets,
  listTransactions,
} from '../../portfolio-domain/repository'
import { getQuotesForAssets } from '../../market-data/supabaseQuoteProvider'
import { getFxRate } from '../../market-data/fxProvider'
import { computeAllPositions, sumPatrimony } from '../../portfolio-domain/computePortfolio'
import { computeDividends } from '../../portfolio-domain/computeDividends'
import { computePerformance } from '../../portfolio-domain/computePerformance'
import type { AssetPosition } from '../../portfolio-domain/computePortfolio'
import type { Asset, TransactionRow } from '../../portfolio-domain/types'
import { TransactionForm } from '../components/TransactionForm'
import { PositionsTable } from '../components/PositionsTable'
import { TransactionHistory } from '../components/TransactionHistory'
import { AllocationBreakdown } from '../components/AllocationBreakdown'
import { DividendsPanel } from '../components/DividendsPanel'
import { PerformancePanel } from '../components/PerformancePanel'
import { CsvImportPanel } from '../components/CsvImportPanel'
import { RiskPanel } from '../components/RiskPanel'
import { RebalancePanel } from '../components/RebalancePanel'
import { ThemeToggle } from '../components/ThemeToggle'
import { computeRisk } from '../../portfolio-domain/computeRisk'
import { exportBackup, downloadBackupFile } from '../../portfolio-domain/backup'

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type Tab = 'carteira' | 'extrato' | 'proventos' | 'performance' | 'alocacao'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('carteira')
  const [portfolioId, setPortfolioId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [positions, setPositions] = useState<AssetPosition[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      const portfolio = await ensureDefaultPortfolio(user.id)
      const account = await ensureDefaultAccount(user.id, portfolio.id)
      setPortfolioId(portfolio.id)
      setAccountId(account.id)

      const [txs, allAssets] = await Promise.all([listTransactions(portfolio.id), listAssets()])
      setTransactions(txs)
      setAssets(allAssets)

      const assetIds = [...new Set(txs.map((t) => t.asset_id))]
      const quotes = await getQuotesForAssets(assetIds)

      // Busca câmbio só para as moedas estrangeiras realmente usadas na carteira.
      const foreignCurrencies = [...new Set(allAssets.filter((a) => a.currency !== 'BRL').map((a) => a.currency))]
      const fxEntries = await Promise.all(
        foreignCurrencies.map(async (currency) => [currency, await getFxRate(currency, 'BRL')] as const)
      )
      const fxRates: Record<string, { rate: string; fetchedAt: string }> = {}
      for (const [currency, fx] of fxEntries) {
        if (fx) fxRates[currency] = fx
      }

      setPositions(computeAllPositions(txs, allAssets, quotes, fxRates))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar carteira')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  const { totalCost, totalMarketValue, hasAllQuotes } = sumPatrimony(positions)
  const result = totalMarketValue - totalCost
  const displayValue = totalMarketValue > 0 ? totalMarketValue : totalCost
  const dividends = computeDividends(transactions, assets)
  const performance = computePerformance(transactions, totalMarketValue)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'carteira', label: 'Carteira' },
    { key: 'extrato', label: 'Extrato' },
    { key: 'proventos', label: 'Proventos' },
    { key: 'performance', label: 'Performance' },
    { key: 'alocacao', label: 'Alocação' },
  ]

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto overflow-x-hidden">
      <header className="flex items-center justify-between gap-2 mb-6">
        <div className="min-w-0">
          <p className="receipt-line text-brand-600 dark:text-brass-soft uppercase tracking-wider truncate">registro de patrimônio</p>
          <h1 className="num-display text-lg sm:text-xl text-brand-700 dark:text-paper">Portfolio OS</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-sm text-ink/50 dark:text-paper/50 hidden md:inline">{user?.email}</span>
          {portfolioId && user && (
            <button
              onClick={async () => {
                const payload = await exportBackup(portfolioId, user.id)
                downloadBackupFile(payload)
              }}
              className="text-xs sm:text-sm text-brand-600 dark:text-brass-soft hover:underline"
            >
              Backup
            </button>
          )}
          <ThemeToggle />
          <button onClick={() => signOut()} className="text-xs sm:text-sm text-brand-600 dark:text-brass-soft hover:underline">
            Sair
          </button>
        </div>
      </header>

      {/* Hero: patrimônio consolidado */}
      <div className="rounded-2xl bg-brand-700 dark:bg-brand-900 text-paper p-5 sm:p-8 mb-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, currentColor 28px)' }}
        />
        <p className="text-xs uppercase tracking-wider text-brass-soft mb-2">Patrimônio</p>
        <p className="num-display text-3xl sm:text-5xl break-words">{fmtMoney(displayValue)}</p>
        {positions.length > 0 && (
          <p className="receipt-line mt-2 text-paper/70">
            {positions.length} ativo{positions.length > 1 ? 's' : ''} · custo total {fmtMoney(totalCost)}
            {totalMarketValue > 0 && ` · cotado a mercado`}
          </p>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-8 mt-6 pt-5 border-t border-paper/15">
          <div>
            <p className="text-xs text-paper/60 uppercase tracking-wide">Investido</p>
            <p className="num-tabular text-base sm:text-lg mt-0.5">{fmtMoney(totalCost)}</p>
          </div>
          <div>
            <p className="text-xs text-paper/60 uppercase tracking-wide">Resultado</p>
            <p className={'num-tabular text-base sm:text-lg mt-0.5 ' + (result >= 0 ? 'text-brass-soft' : 'text-red-300')}>
              {result >= 0 ? '▲' : '▼'} {fmtMoney(Math.abs(result))}
            </p>
          </div>
          {dividends.sinceInception > 0 && (
            <div>
              <p className="text-xs text-paper/60 uppercase tracking-wide">Proventos</p>
              <p className="num-tabular text-base sm:text-lg mt-0.5 text-brass-soft">{fmtMoney(dividends.sinceInception)}</p>
            </div>
          )}
        </div>
        {!hasAllQuotes && positions.length > 0 && (
          <p className="receipt-line mt-4 text-paper/50">algumas posições sem cotação sincronizada — valor de mercado parcial</p>
        )}
      </div>

      {error && <p className="text-sm text-loss mb-4">{error}</p>}

      {!loading && portfolioId && accountId && user && (
        <div className="mb-6">
          <TransactionForm userId={user.id} portfolioId={portfolioId} accountId={accountId} onDone={reload} />
        </div>
      )}

      {/* Navegação por abas — rolagem horizontal em telas estreitas, nunca quebra o layout */}
      <div className="flex gap-1 mb-4 border-b border-hairline dark:border-hairline-dark overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              'px-3 sm:px-4 py-2 text-sm -mb-px border-b-2 transition whitespace-nowrap shrink-0 ' +
              (tab === t.key
                ? 'border-brand-600 text-brand-700 dark:text-paper dark:border-brass font-medium'
                : 'border-transparent text-ink/45 dark:text-paper/45 hover:text-ink/70 dark:hover:text-paper/70')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ink/50 dark:text-paper/50">Carregando…</p>
      ) : tab === 'carteira' ? (
        <div className="space-y-6">
          <PositionsTable positions={positions} />
          <AllocationBreakdown positions={positions} />
        </div>
      ) : tab === 'extrato' ? (
        <div className="space-y-4">
          {portfolioId && accountId && user && (
            <CsvImportPanel
              userId={user.id}
              portfolioId={portfolioId}
              accountId={accountId}
              existingTransactions={transactions}
              onImported={reload}
            />
          )}
          <TransactionHistory transactions={transactions} assets={assets} />
        </div>
      ) : tab === 'proventos' ? (
        <DividendsPanel summary={dividends} />
      ) : tab === 'performance' ? (
        <PerformancePanel performance={performance} />
      ) : (
        <div className="space-y-6">
          <RiskPanel risk={computeRisk(positions)} />
          {portfolioId && user && <RebalancePanel userId={user.id} portfolioId={portfolioId} positions={positions} />}
        </div>
      )}
    </div>
  )
}
