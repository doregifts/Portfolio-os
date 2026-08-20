import type { Asset, TransactionRow } from '../../portfolio-domain/types'

const typeLabels: Record<string, string> = {
  BUY: 'Compra',
  SELL: 'Venda',
  DIVIDEND: 'Dividendo',
  JCP: 'JCP',
  BONUS: 'Bonificação',
  SPLIT: 'Split',
  REVERSE_SPLIT: 'Grupamento',
}

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function TransactionHistory({ transactions, assets }: { transactions: TransactionRow[]; assets: Asset[] }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline dark:border-hairline-dark p-12 text-center">
        <p className="num-display text-lg text-ink/70 dark:text-paper/70">Nenhuma operação ainda.</p>
        <p className="text-sm text-ink/50 dark:text-paper/50 mt-1.5">O extrato aparece aqui conforme você registra.</p>
      </div>
    )
  }

  const sorted = [...transactions].sort((a, b) => b.trade_date.localeCompare(a.trade_date))

  return (
    <div className="rounded-2xl border border-hairline dark:border-hairline-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-ink/40 dark:text-paper/40 uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-medium">Data</th>
              <th className="text-left px-4 py-3 font-medium">Ativo</th>
              <th className="text-left px-4 py-3 font-medium">Tipo</th>
              <th className="text-right px-4 py-3 font-medium">Qtd</th>
              <th className="text-right px-5 py-3 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const asset = assets.find((a) => a.id === t.asset_id)
              const isIncome = t.transaction_type === 'DIVIDEND' || t.transaction_type === 'JCP'
              const total = Number(t.unit_price ?? 0) * Number(t.quantity)
              return (
                <tr key={t.id} className="border-t border-hairline dark:border-hairline-dark">
                  <td className="px-5 py-3 text-ink/60 dark:text-paper/60 num-tabular">
                    {new Date(t.trade_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px]">{asset?.ticker ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'text-xs px-2 py-0.5 rounded-full ' +
                        (t.transaction_type === 'BUY'
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100'
                          : t.transaction_type === 'SELL'
                          ? 'bg-loss/10 text-loss'
                          : 'bg-brass/10 text-brass')
                      }
                    >
                      {typeLabels[t.transaction_type] ?? t.transaction_type}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3 num-tabular text-ink/60 dark:text-paper/60">
                    {isIncome ? '—' : t.quantity}
                  </td>
                  <td className="text-right px-5 py-3 num-tabular font-medium">{fmtMoney(total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
