import type { RiskSummary } from '../../portfolio-domain/computeRisk'

export function RiskPanel({ risk }: { risk: RiskSummary }) {
  if (!risk.topPosition) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline dark:border-hairline-dark p-8 text-center text-sm text-ink/50 dark:text-paper/50">
        Sem posições para analisar concentração.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-hairline dark:border-hairline-dark p-5">
      <h2 className="receipt-line uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-4">
        Concentração
      </h2>

      <div className="flex items-baseline gap-3 mb-1">
        <p className="num-display text-2xl">{(risk.concentrationIndex * 100).toFixed(0)}%</p>
        <p className="text-xs text-ink/45 dark:text-paper/45">índice de concentração (HHI)</p>
      </div>
      <p className="receipt-line text-ink/40 dark:text-paper/40 mb-4">
        soma dos pesos² de cada ativo — 100% = tudo em um único ativo, quanto menor, mais diversificado
      </p>

      <p className="text-sm text-ink/70 dark:text-paper/70">
        {risk.topPosition.ticker} representa{' '}
        <strong>{(risk.topPosition.weight * 100).toFixed(1)}%</strong> da carteira.
      </p>

      {risk.concentratedAssets.length > 0 && (
        <div className="mt-3 pt-3 border-t border-hairline dark:border-hairline-dark">
          <p className="text-xs text-brass uppercase tracking-wide mb-2">Acima de 25% da carteira</p>
          <ul className="space-y-1">
            {risk.concentratedAssets.map((a) => (
              <li key={a.ticker} className="text-sm flex justify-between">
                <span className="font-mono">{a.ticker}</span>
                <span className="num-tabular">{(a.weight * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="receipt-line text-ink/35 dark:text-paper/35 mt-4">
        informativo — não é recomendação de compra ou venda
      </p>
    </div>
  )
}
