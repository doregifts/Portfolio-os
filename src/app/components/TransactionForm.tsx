import { useState } from 'react'
import { findOrCreateAsset, createTransaction } from '../../portfolio-domain/repository'

interface Props {
  userId: string
  portfolioId: string
  accountId: string
  onDone: () => void
}

export function TransactionForm({ userId, portfolioId, accountId, onDone }: Props) {
  const [ticker, setTicker] = useState('')
  const [assetName, setAssetName] = useState('')
  const [exchange, setExchange] = useState<'B3' | 'NASDAQ' | 'NYSE'>('B3')
  const [type, setType] = useState<'BUY' | 'SELL' | 'DIVIDEND' | 'JCP' | 'BONUS' | 'SPLIT' | 'REVERSE_SPLIT'>('BUY')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [fees, setFees] = useState('0')
  const isIncomeType = type === 'DIVIDEND' || type === 'JCP'
  const isCorporateAction = type === 'BONUS' || type === 'SPLIT' || type === 'REVERSE_SPLIT'
  const needsPrice = !isCorporateAction
  const quantityLabel =
    type === 'SPLIT' ? 'Fator do split (ex: 2 para 2:1)'
    : type === 'REVERSE_SPLIT' ? 'Fator do grupamento (ex: 10 para 1:10)'
    : type === 'BONUS' ? 'Quantidade bonificada'
    : 'Quantidade'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const upperTicker = ticker.trim().toUpperCase()
      const isB3 = exchange === 'B3'
      const asset = await findOrCreateAsset({
        ticker: upperTicker,
        name: assetName.trim() || upperTicker,
        exchange,
        assetClass: 'stock',
        currency: isB3 ? 'BRL' : 'USD',
        country: isB3 ? 'BR' : 'US',
        quoteSymbol: isB3 ? `${upperTicker}.SAO` : upperTicker,
      })

      await createTransaction({
        userId,
        portfolioId,
        accountId,
        assetId: asset.id,
        type,
        date,
        // Proventos (DIVIDEND/JCP): quantity=1, unitPrice=valor recebido (não afeta posição).
        // Corporate actions (SPLIT/REVERSE_SPLIT): quantity=fator, sem preço.
        // BONUS: quantity=quantidade recebida, sem preço.
        quantity: isIncomeType ? '1' : quantity,
        unitPrice: needsPrice ? unitPrice : undefined,
        fees: isCorporateAction ? '0' : fees,
      })

      setTicker('')
      setAssetName('')
      setQuantity('')
      setUnitPrice('')
      setFees('0')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar transação')
    } finally {
      setBusy(false)
    }
  }

  const field = "w-full rounded-lg border border-hairline dark:border-hairline-dark bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus-visible:ring-2 ring-brass"
  const labelCls = "text-xs uppercase tracking-wide text-ink/45 dark:text-paper/45 block mb-1"

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline dark:border-hairline-dark p-5">
      <h2 className="receipt-line uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-4">Registrar operação</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Ticker</label>
          <input required value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder={exchange === 'B3' ? 'PETR4' : 'AAPL'} className={field + ' font-mono'} />
        </div>
        <div>
          <label className={labelCls}>Bolsa</label>
          <select value={exchange} onChange={(e) => setExchange(e.target.value as typeof exchange)} className={field}>
            <option value="B3">B3 (BRL)</option>
            <option value="NASDAQ">NASDAQ (USD)</option>
            <option value="NYSE">NYSE (USD)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Nome do ativo</label>
          <input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder={exchange === 'B3' ? 'Petrobras PN' : 'Apple Inc'} className={field} />
        </div>
        <div>
          <label className={labelCls}>Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={field}>
            <optgroup label="Movimentação">
              <option value="BUY">Compra</option>
              <option value="SELL">Venda</option>
            </optgroup>
            <optgroup label="Proventos">
              <option value="DIVIDEND">Dividendo</option>
              <option value="JCP">JCP</option>
            </optgroup>
            <optgroup label="Eventos societários">
              <option value="BONUS">Bonificação</option>
              <option value="SPLIT">Desdobramento (split)</option>
              <option value="REVERSE_SPLIT">Grupamento</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label className={labelCls}>Data</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </div>

        {!isIncomeType && (
          <div>
            <label className={labelCls}>{quantityLabel}</label>
            <input required inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="100" className={field + ' num-tabular'} />
          </div>
        )}
        {needsPrice && (
          <div>
            <label className={labelCls}>{isIncomeType ? 'Valor recebido' : 'Preço unitário'}</label>
            <input required inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder={isIncomeType ? '150,00' : '20,00'} className={field + ' num-tabular'} />
          </div>
        )}

        {!isIncomeType && !isCorporateAction && (
          <div>
            <label className={labelCls}>Taxas</label>
            <input inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} className={field + ' num-tabular'} />
          </div>
        )}
      </div>

      {isCorporateAction && (
        <p className="receipt-line text-brass mt-3">
          {type === 'SPLIT' && 'quantidade × fator, PM ÷ fator — custo total permanece igual'}
          {type === 'REVERSE_SPLIT' && 'quantidade ÷ fator, PM × fator — custo total permanece igual'}
          {type === 'BONUS' && 'quantidade entra sem custo adicional — dilui o preço médio'}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 mt-1">
        {error && <p className="text-xs text-loss">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="ml-auto rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-5 py-2 transition disabled:opacity-50"
        >
          {busy ? 'Salvando…' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}
