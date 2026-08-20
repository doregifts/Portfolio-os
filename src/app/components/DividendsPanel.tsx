import type { DividendsSummary } from '../../portfolio-domain/computeDividends'

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function DividendsPanel({ summary }: { summary: DividendsSummary }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-hairline dark:border-hairline-dark p-5">
        <h2 className="receipt-line uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-4">Proventos recebidos</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-ink/45 dark:text-paper/45 uppercase tracking-wide">Este mês</p>
            <p className="num-display text-xl mt-1">{fmtMoney(summary.thisMonth)}</p>
          </div>
          <div>
            <p className="text-xs text-ink/45 dark:text-paper/45 uppercase tracking-wide">Este ano</p>
            <p className="num-display text-xl mt-1">{fmtMoney(summary.thisYear)}</p>
          </div>
          <div>
            <p className="text-xs text-ink/45 dark:text-paper/45 uppercase tracking-wide">Desde o início</p>
            <p className="num-display text-xl mt-1">{fmtMoney(summary.sinceInception)}</p>
          </div>
        </div>
        <p className="receipt-line text-ink/40 dark:text-paper/40 mt-4">
          soma apenas de proventos registrados manualmente — não inclui anunciados/estimados
        </p>
      </div>

      {summary.events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline dark:border-hairline-dark p-12 text-center">
          <p className="num-display text-lg text-ink/70 dark:text-paper/70">Nenhum provento registrado ainda.</p>
          <p className="text-sm text-ink/50 dark:text-paper/50 mt-1.5">
            Use "Registrar operação" com tipo Dividendo ou JCP.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-hairline dark:border-hairline-dark overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-ink/40 dark:text-paper/40 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Ativo</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-right px-5 py-3 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {summary.events.map((e) => (
                <tr key={e.id} className="border-t border-hairline dark:border-hairline-dark">
                  <td className="px-5 py-3 num-tabular text-ink/60 dark:text-paper/60">
                    {new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px]">{e.assetTicker}</td>
                  <td className="px-4 py-3 text-ink/60 dark:text-paper/60">{e.type === 'DIVIDEND' ? 'Dividendo' : 'JCP'}</td>
                  <td className="text-right px-5 py-3 num-tabular font-medium text-gain">{fmtMoney(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
