import type { AssetPosition } from '../../portfolio-domain/computePortfolio'

function fmtMoney(v: string | number | null, currency = 'BRL') {
  if (v === null) return '—'
  return Number(v).toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency })
}

export function PositionsTable({ positions }: { positions: AssetPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline dark:border-hairline-dark p-12 text-center">
        <p className="num-display text-lg text-ink/70 dark:text-paper/70">Sua carteira começa aqui.</p>
        <p className="text-sm text-ink/50 dark:text-paper/50 mt-1.5">Registre sua primeira operação acima.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-hairline dark:border-hairline-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-ink/40 dark:text-paper/40 uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-medium">Ativo</th>
              <th className="text-right px-4 py-3 font-medium">Qtd</th>
              <th className="text-right px-4 py-3 font-medium">PM</th>
              <th className="text-right px-4 py-3 font-medium">Cotação</th>
              <th className="text-right px-4 py-3 font-medium">Valor</th>
              <th className="text-right px-5 py-3 font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.asset.id} className="border-t border-hairline dark:border-hairline-dark">
                <td className="px-5 py-4">
                  <div className="font-mono text-[13px] font-medium tracking-tight flex items-center gap-1.5">
                    {p.asset.ticker}
                    {p.asset.currency !== 'BRL' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brass/10 text-brass font-sans">{p.asset.currency}</span>
                    )}
                  </div>
                  <div className="text-xs text-ink/45 dark:text-paper/45 mt-0.5">{p.asset.name}</div>
                </td>
                <td className="text-right px-4 py-4 num-tabular">{p.quantity}</td>
                <td className="text-right px-4 py-4 num-tabular">
                  {fmtMoney(p.averagePrice, p.asset.currency)}
                  <div className="receipt-line text-ink/40 dark:text-paper/40 mt-0.5">
                    {Number(p.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}÷{p.quantity}
                  </div>
                </td>
                <td className="text-right px-4 py-4 num-tabular">
                  {p.currentPrice ? fmtMoney(p.currentPrice, p.asset.currency) : <span className="text-ink/30 dark:text-paper/30">—</span>}
                </td>
                <td className="text-right px-4 py-4 num-tabular font-medium">
                  {fmtMoney(p.marketValue, p.asset.currency)}
                  {p.asset.currency !== 'BRL' && p.marketValueBRL && (
                    <div className="receipt-line text-ink/40 dark:text-paper/40 mt-0.5">
                      ≈ {fmtMoney(p.marketValueBRL, 'BRL')} (câmbio {p.fxRate})
                    </div>
                  )}
                  {p.asset.currency !== 'BRL' && !p.fxRate && (
                    <div className="receipt-line text-loss mt-0.5">câmbio não sincronizado</div>
                  )}
                </td>
                <td
                  className={
                    'text-right px-5 py-4 num-tabular font-medium ' +
                    (p.result === null ? 'text-ink/30 dark:text-paper/30' : Number(p.result) >= 0 ? 'text-gain' : 'text-loss')
                  }
                >
                  {p.result === null ? '—' : `${Number(p.result) >= 0 ? '▲' : '▼'} ${fmtMoney(Math.abs(Number(p.result)), p.asset.currency)}`}
                  {p.resultPercent !== null && (
                    <div className="receipt-line opacity-70">{p.resultPercent}%</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {positions.some((p) => p.quoteFetchedAt) && (
        <p className="receipt-line px-5 py-2.5 border-t border-hairline dark:border-hairline-dark text-ink/40 dark:text-paper/40">
          cotações da última sincronização manual — não são tempo real
        </p>
      )}
    </div>
  )
}
