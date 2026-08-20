import { useEffect, useState } from 'react'
import { listAllocationTargets, setAllocationTarget } from '../../portfolio-domain/repository'
import { computeRebalance } from '../../portfolio-domain/computeRebalance'
import type { AssetPosition } from '../../portfolio-domain/computePortfolio'

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  userId: string
  portfolioId: string
  positions: AssetPosition[]
}

export function RebalancePanel({ userId, portfolioId, positions }: Props) {
  const [targets, setTargets] = useState<Record<string, number>>({})
  const [contribution, setContribution] = useState('1000')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllocationTargets(portfolioId).then((t) => {
      setTargets(t)
      setLoading(false)
    })
  }, [portfolioId])

  async function updateTarget(assetId: string, pct: string) {
    const weight = Math.max(0, Math.min(100, Number(pct))) / 100
    setTargets((prev) => ({ ...prev, [assetId]: weight }))
    await setAllocationTarget(userId, portfolioId, assetId, weight)
  }

  if (loading) return null
  if (positions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline dark:border-hairline-dark p-8 text-center text-sm text-ink/50 dark:text-paper/50">
        Sem posições para definir metas de alocação.
      </div>
    )
  }

  const rows = computeRebalance(positions, targets, Number(contribution) || 0)
  const totalTarget = Object.values(targets).reduce((s, v) => s + v, 0)

  return (
    <div className="rounded-2xl border border-hairline dark:border-hairline-dark p-5">
      <h2 className="receipt-line uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-4">
        Metas de alocação e simulador de aporte
      </h2>

      <div className="space-y-3 mb-5">
        {positions.map((p) => {
          const targetPct = (targets[p.asset.id] ?? 0) * 100
          const row = rows.find((r) => r.assetId === p.asset.id)
          return (
            <div key={p.asset.id} className="flex items-center flex-wrap gap-2 sm:gap-3">
              <span className="font-mono text-xs w-14 shrink-0">{p.asset.ticker}</span>
              <span className="text-xs text-ink/45 dark:text-paper/45 shrink-0 num-tabular">
                {row ? (row.currentWeight * 100).toFixed(1) : '0'}% atual
              </span>
              <input
                type="number"
                min={0}
                max={100}
                defaultValue={targetPct || ''}
                placeholder="meta %"
                onBlur={(e) => updateTarget(p.asset.id, e.target.value)}
                className="w-16 shrink-0 rounded-lg border border-hairline dark:border-hairline-dark bg-transparent px-2 py-1 text-xs num-tabular"
              />
              {row && row.suggestedContribution > 0 && (
                <span className="text-xs text-gain ml-auto">
                  aportar {fmtMoney(row.suggestedContribution)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {totalTarget > 0 && Math.abs(totalTarget - 1) > 0.01 && (
        <p className="text-xs text-brass mb-3">
          as metas somam {(totalTarget * 100).toFixed(0)}% — o ideal é somar 100%
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-hairline dark:border-hairline-dark">
        <label className="text-xs text-ink/50 dark:text-paper/50">Simular aporte de</label>
        <input
          type="number"
          value={contribution}
          onChange={(e) => setContribution(e.target.value)}
          className="w-28 rounded-lg border border-hairline dark:border-hairline-dark bg-transparent px-2 py-1 text-sm num-tabular"
        />
      </div>
      <p className="receipt-line text-ink/35 dark:text-paper/35 mt-3">
        distribui o valor entre os ativos abaixo da meta, sem sugerir venda de nada — cálculo
        matemático, não recomendação de investimento
      </p>
    </div>
  )
}
