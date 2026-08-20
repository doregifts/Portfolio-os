import type { PerformanceResult } from '../../portfolio-domain/computePerformance'

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtPct(v: number) {
  return `${(v * 100).toFixed(2)}%`
}

export function PerformancePanel({ performance }: { performance: PerformanceResult }) {
  if (performance.totalInvested === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline dark:border-hairline-dark p-12 text-center">
        <p className="num-display text-lg text-ink/70 dark:text-paper/70">Sem dados suficientes.</p>
        <p className="text-sm text-ink/50 dark:text-paper/50 mt-1.5">
          Registre operações de compra para calcular performance.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-hairline dark:border-hairline-dark p-5">
        <h2 className="receipt-line uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-4">
          Performance
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-ink/45 dark:text-paper/45 uppercase tracking-wide">XIRR (anualizado)</p>
            <p className={'num-display text-2xl mt-1 ' + (performance.xirr !== null && performance.xirr >= 0 ? 'text-gain' : performance.xirr !== null ? 'text-loss' : '')}>
              {performance.xirr !== null ? fmtPct(performance.xirr) : '—'}
            </p>
            <p className="receipt-line text-ink/40 dark:text-paper/40 mt-1">
              retorno ponderado pelo tamanho e data de cada aporte
            </p>
          </div>
          <div>
            <p className="text-xs text-ink/45 dark:text-paper/45 uppercase tracking-wide">Retorno simples</p>
            <p className={'num-display text-2xl mt-1 ' + (performance.simpleReturn !== null && performance.simpleReturn >= 0 ? 'text-gain' : performance.simpleReturn !== null ? 'text-loss' : '')}>
              {performance.simpleReturn !== null ? fmtPct(performance.simpleReturn) : '—'}
            </p>
            <p className="receipt-line text-ink/40 dark:text-paper/40 mt-1">
              (valor atual − investido líquido) ÷ investido líquido, sem considerar o tempo
            </p>
          </div>
        </div>

        <div className="flex gap-8 mt-5 pt-5 border-t border-hairline dark:border-hairline-dark">
          <div>
            <p className="text-xs text-ink/45 dark:text-paper/45 uppercase tracking-wide">Investido (bruto)</p>
            <p className="num-tabular text-sm mt-0.5">{fmtMoney(performance.totalInvested)}</p>
          </div>
          <div>
            <p className="text-xs text-ink/45 dark:text-paper/45 uppercase tracking-wide">Valor atual</p>
            <p className="num-tabular text-sm mt-0.5">{fmtMoney(performance.currentValue)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-hairline dark:border-hairline-dark p-4">
        <p className="text-xs text-ink/60 dark:text-paper/60">
          <strong className="text-ink/80 dark:text-paper/80">TWR (time-weighted) ainda não disponível.</strong>{' '}
          Esse cálculo precisa do valor da carteira em pontos periódicos ao longo do tempo, não só das
          datas de compra/venda. Sem esse histórico, qualquer número aqui seria estimado, não calculado —
          por isso não aparece.
        </p>
      </div>
    </div>
  )
}
