import Decimal from 'decimal.js'
import type { AssetTransaction, PositionResult, SellResult } from './types'

// Precisão alta durante o cálculo; arredondamento só acontece na exibição (camada de UI).
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export interface RealizedEvent {
  transactionId: string
  date: string
  quantitySold: Decimal
  proceeds: Decimal
  costBasis: Decimal
  realizedProfit: Decimal
}

export interface EngineResult {
  quantity: Decimal
  averagePrice: Decimal
  totalCost: Decimal
  realizedEvents: RealizedEvent[]
}

/**
 * Processa uma lista ORDENADA (por data) de transações de um único ativo
 * e retorna a posição resultante + eventos de venda realizados.
 *
 * Regras (ver PROJECT_SPEC.md seção 6):
 * - Nunca usa float binário: tudo em Decimal.
 * - Preço médio nunca é arredondado durante o cálculo intermediário.
 * - Venda parcial preserva o PM da posição restante.
 * - Split/grupamento preserva o custo total.
 */
export function computePosition(transactions: AssetTransaction[]): EngineResult {
  let quantity = new Decimal(0)
  let totalCost = new Decimal(0)
  const realizedEvents: RealizedEvent[] = []

  for (const tx of transactions) {
    const qty = new Decimal(tx.quantity)

    switch (tx.type) {
      case 'BUY': {
        const price = new Decimal(tx.unitPrice ?? 0)
        const fees = new Decimal(tx.fees ?? 0)
        const taxes = new Decimal(tx.taxes ?? 0)
        const cost = price.times(qty).plus(fees).plus(taxes)
        totalCost = totalCost.plus(cost)
        quantity = quantity.plus(qty)
        break
      }

      case 'SELL': {
        if (qty.greaterThan(quantity)) {
          throw new Error(
            `Venda de ${qty.toString()} excede a posição atual de ${quantity.toString()} (transação ${tx.id})`
          )
        }
        const avgPriceBefore = quantity.isZero() ? new Decimal(0) : totalCost.dividedBy(quantity)
        const costBasis = avgPriceBefore.times(qty)
        const price = new Decimal(tx.unitPrice ?? 0)
        const fees = new Decimal(tx.fees ?? 0)
        const taxes = new Decimal(tx.taxes ?? 0)
        const proceeds = price.times(qty).minus(fees).minus(taxes)

        realizedEvents.push({
          transactionId: tx.id,
          date: tx.date,
          quantitySold: qty,
          proceeds,
          costBasis,
          realizedProfit: proceeds.minus(costBasis),
        })

        totalCost = totalCost.minus(costBasis)
        quantity = quantity.minus(qty)
        break
      }

      case 'BONUS':
      case 'TRANSFER_IN': {
        // Entra quantidade sem custo adicional (bonificação) ou com custo já contabilizado
        // em outro registro (transferência) — ajustar conforme regra específica quando
        // a Fase 7 (corporate actions) definir a metodologia oficial de bonificação.
        quantity = quantity.plus(qty)
        break
      }

      case 'TRANSFER_OUT': {
        if (qty.greaterThan(quantity)) {
          throw new Error(`Transferência de saída excede a posição (transação ${tx.id})`)
        }
        const avgPriceBefore = quantity.isZero() ? new Decimal(0) : totalCost.dividedBy(quantity)
        totalCost = totalCost.minus(avgPriceBefore.times(qty))
        quantity = quantity.minus(qty)
        break
      }

      case 'SPLIT': {
        // qty = fator do split (ex: 2 para 2:1). Custo total permanece inalterado.
        quantity = quantity.times(qty)
        break
      }

      case 'REVERSE_SPLIT': {
        // qty = fator do grupamento (ex: 10 para 1:10). Custo total permanece inalterado.
        quantity = quantity.dividedBy(qty)
        break
      }

      case 'DIVIDEND':
      case 'JCP':
      case 'FEE':
      case 'TAX':
      case 'CASH_DEPOSIT':
      case 'CASH_WITHDRAW':
        // Não afetam quantidade/custo da posição do ativo. Tratados como fluxo de caixa
        // à parte (proventos consolidados chegam na Fase 4).
        break

      default: {
        const _exhaustive: never = tx.type
        throw new Error(`Tipo de transação não tratado: ${_exhaustive}`)
      }
    }
  }

  const averagePrice = quantity.isZero() ? new Decimal(0) : totalCost.dividedBy(quantity)

  return { quantity, averagePrice, totalCost, realizedEvents }
}

/** Converte o resultado interno (Decimal) para strings prontas para exibição/serialização. */
export function toPositionResult(result: EngineResult): PositionResult {
  return {
    quantity: result.quantity.toString(),
    averagePrice: result.averagePrice.toString(),
    totalCost: result.totalCost.toString(),
  }
}

export function toSellResult(result: EngineResult): SellResult | null {
  if (result.realizedEvents.length === 0) return null
  const last = result.realizedEvents[result.realizedEvents.length - 1]
  return {
    ...toPositionResult(result),
    realizedProfit: last.realizedProfit.toString(),
    proceeds: last.proceeds.toString(),
  }
}
