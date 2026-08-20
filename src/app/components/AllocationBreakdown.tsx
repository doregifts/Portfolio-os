import type { AssetPosition } from '../../portfolio-domain/computePortfolio'

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function AllocationBreakdown({ positions }: { positions: AssetPosition[] }) {
  if (positions.length === 0) return null

  // Usa custo como base quando não há cotação de mercado — nunca inventa peso sem dado real.
  const weightBasis = positions.map((p) => ({
    ticker: p.asset.ticker,
    value: Number(p.marketValue ?? p.totalCost),
  }))
  const total = weightBasis.reduce((sum, p) => sum + p.value, 0)
  if (total <= 0) return null

  const sorted = [...weightBasis].sort((a, b) => b.value - a.value)

  return (
    <div className="rounded-2xl border border-hairline dark:border-hairline-dark p-5">
      <h2 className="receipt-line uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-4">
        Alocação por ativo
      </h2>
      <div className="space-y-3">
        {sorted.map((p) => {
          const pct = (p.value / total) * 100
          return (
            <div key={p.ticker}>
              <div className="flex items-baseline justify-between text-sm mb-1">
                <span className="font-mono text-[13px]">{p.ticker}</span>
                <span className="num-tabular text-ink/60 dark:text-paper/60">
                  {pct.toFixed(1)}% <span className="receipt-line ml-1">{fmtMoney(p.value)}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-brand-50 dark:bg-brand-900/40 overflow-hidden">
                <div className="h-full bg-brand-600 dark:bg-brass" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
