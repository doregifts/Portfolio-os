// XIRR (retorno anualizado ponderado por fluxo de caixa) via método de Newton-Raphson.
// Ver PROJECT_SPEC.md seção 40. Diferente do ledger (posição/custo), a taxa resultante
// não é um valor monetário armazenado — é a saída de um solver numérico iterativo, então
// usar float padrão aqui é aceitável (não há acúmulo de erro de arredondamento monetário).

export interface CashFlow {
  date: Date
  amount: number // negativo = saída (investimento), positivo = entrada (venda/provento/valor final)
}

function xnpv(rate: number, flows: CashFlow[], t0: Date): number {
  return flows.reduce((sum, cf) => {
    const days = (cf.date.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24)
    return sum + cf.amount / Math.pow(1 + rate, days / 365)
  }, 0)
}

function xnpvDerivative(rate: number, flows: CashFlow[], t0: Date): number {
  return flows.reduce((sum, cf) => {
    const days = (cf.date.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24)
    const years = days / 365
    if (years === 0) return sum
    return sum - (years * cf.amount) / Math.pow(1 + rate, years + 1)
  }, 0)
}

/**
 * Calcula a XIRR de uma lista de fluxos de caixa com datas (formato Excel/planilha).
 * Retorna null se não convergir (ex: fluxos insuficientes ou todos do mesmo sinal).
 */
export function computeXIRR(flows: CashFlow[], guess = 0.1): number | null {
  if (flows.length < 2) return null

  const hasPositive = flows.some((f) => f.amount > 0)
  const hasNegative = flows.some((f) => f.amount < 0)
  if (!hasPositive || !hasNegative) return null

  const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime())
  const t0 = sorted[0].date

  let rate = guess
  const maxIterations = 100
  const tolerance = 1e-7

  for (let i = 0; i < maxIterations; i++) {
    const value = xnpv(rate, sorted, t0)
    const derivative = xnpvDerivative(rate, sorted, t0)
    if (Math.abs(derivative) < 1e-12) return null

    const newRate = rate - value / derivative
    if (!Number.isFinite(newRate)) return null

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate
    }
    rate = newRate
  }

  return null // não convergiu dentro do limite de iterações
}
