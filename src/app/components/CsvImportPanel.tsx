import { useRef, useState } from 'react'
import { parseTransactionsCsv } from '../../portfolio-domain/csvImport'
import type { ImportPreview } from '../../portfolio-domain/csvImport'
import { findOrCreateAsset, createTransactionsBulk } from '../../portfolio-domain/repository'
import type { TransactionRow } from '../../portfolio-domain/types'

interface Props {
  userId: string
  portfolioId: string
  accountId: string
  existingTransactions: TransactionRow[]
  onImported: () => void
}

export function CsvImportPanel({ userId, portfolioId, accountId, existingTransactions, onImported }: Props) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    setDone(null)
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      setPreview(parseTransactionsCsv(text, existingTransactions))
    }
    reader.readAsText(file, 'utf-8')
  }

  async function confirmImport() {
    if (!preview) return
    setImporting(true)
    setError(null)
    try {
      const validRows = preview.rows.filter((r) => r.status === 'valid')
      // Resolve/cria os ativos primeiro (várias linhas podem repetir o mesmo ticker).
      const assetCache = new Map<string, string>()
      for (const row of validRows) {
        if (!assetCache.has(row.ticker)) {
          const asset = await findOrCreateAsset({
            ticker: row.ticker,
            name: row.ticker,
            exchange: 'B3',
            assetClass: 'stock',
            currency: 'BRL',
            country: 'BR',
            quoteSymbol: `${row.ticker}.SAO`,
          })
          assetCache.set(row.ticker, asset.id)
        }
      }

      await createTransactionsBulk(
        validRows.map((row) => ({
          userId,
          portfolioId,
          accountId,
          assetId: assetCache.get(row.ticker)!,
          type: row.type,
          date: row.date,
          quantity: row.quantity,
          unitPrice: row.unitPrice || undefined,
          fees: row.fees,
        }))
      )

      setDone(validRows.length)
      setPreview(null)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar')
    } finally {
      setImporting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-brand-600 dark:text-brass-soft hover:underline"
      >
        Importar CSV
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-hairline dark:border-hairline-dark p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="receipt-line uppercase tracking-wider text-ink/50 dark:text-paper/50">Importar CSV</h2>
        <button onClick={() => { setOpen(false); setPreview(null); setDone(null) }} className="text-xs text-ink/40 dark:text-paper/40 hover:underline">
          fechar
        </button>
      </div>

      {!preview && !done && (
        <div>
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-3">
            Colunas esperadas: <span className="font-mono">data,ticker,tipo,quantidade,preco,taxas</span>
            {' '}— data no formato AAAA-MM-DD, tipo em BUY/SELL/DIVIDEND/JCP/BONUS/SPLIT/REVERSE_SPLIT.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="text-sm"
          />
        </div>
      )}

      {preview && (
        <div>
          <div className="flex gap-4 text-sm mb-3">
            <span className="text-gain">{preview.validCount} válidas</span>
            <span className="text-brass">{preview.duplicateCount} duplicadas (não serão importadas)</span>
            <span className="text-loss">{preview.invalidCount} com erro</span>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-hairline dark:border-hairline-dark mb-4">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-paper dark:bg-paper-dark">
                <tr className="text-ink/40 dark:text-paper/40 uppercase">
                  <th className="text-left px-3 py-2">Linha</th>
                  <th className="text-left px-3 py-2">Data</th>
                  <th className="text-left px-3 py-2">Ticker</th>
                  <th className="text-left px-3 py-2">Tipo</th>
                  <th className="text-right px-3 py-2">Qtd</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.rowNumber} className="border-t border-hairline dark:border-hairline-dark">
                    <td className="px-3 py-1.5 num-tabular">{r.rowNumber}</td>
                    <td className="px-3 py-1.5">{r.date}</td>
                    <td className="px-3 py-1.5 font-mono">{r.ticker}</td>
                    <td className="px-3 py-1.5">{r.type}</td>
                    <td className="px-3 py-1.5 text-right num-tabular">{r.quantity}</td>
                    <td className="px-3 py-1.5">
                      {r.status === 'valid' && <span className="text-gain">ok</span>}
                      {r.status === 'duplicate' && <span className="text-brass">duplicada</span>}
                      {r.status === 'invalid' && <span className="text-loss">{r.errors.join('; ')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-xs text-loss mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={confirmImport}
              disabled={importing || preview.validCount === 0}
              className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 transition disabled:opacity-50"
            >
              {importing ? 'Importando…' : `Confirmar importação (${preview.validCount})`}
            </button>
            <button onClick={() => setPreview(null)} className="text-sm text-ink/50 dark:text-paper/50 hover:underline">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {done !== null && (
        <p className="text-sm text-gain">{done} operações importadas com sucesso.</p>
      )}
    </div>
  )
}
