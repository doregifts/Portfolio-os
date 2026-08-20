import { describe, it, expect } from 'vitest'
import { computeXIRR } from '../xirr'

describe('computeXIRR', () => {
  it('caso simples: investe 1000, recebe 1200 em exatos 365 dias -> ~20% a.a.', () => {
    const rate = computeXIRR([
      { date: new Date('2025-01-01'), amount: -1000 },
      { date: new Date('2026-01-01'), amount: 1200 },
    ])
    expect(rate).not.toBeNull()
    expect(rate!).toBeCloseTo(0.2, 2)
  })

  it('caso clássico do Excel: fluxos irregulares, resultado conhecido ~37.3%', () => {
    // Exemplo canônico usado para validar implementações de XIRR (Microsoft docs).
    const rate = computeXIRR([
      { date: new Date('2008-01-01'), amount: -10000 },
      { date: new Date('2008-03-01'), amount: 2750 },
      { date: new Date('2008-10-30'), amount: 4250 },
      { date: new Date('2009-02-15'), amount: 3250 },
      { date: new Date('2009-04-01'), amount: 2750 },
    ])
    expect(rate).not.toBeNull()
    expect(rate!).toBeCloseTo(0.373, 2)
  })

  it('retorna null quando todos os fluxos são do mesmo sinal (sem retorno calculável)', () => {
    const rate = computeXIRR([
      { date: new Date('2025-01-01'), amount: -1000 },
      { date: new Date('2025-06-01'), amount: -500 },
    ])
    expect(rate).toBeNull()
  })

  it('retorna null com menos de 2 fluxos', () => {
    expect(computeXIRR([{ date: new Date(), amount: -100 }])).toBeNull()
  })

  it('prejuízo dá taxa negativa', () => {
    const rate = computeXIRR([
      { date: new Date('2025-01-01'), amount: -1000 },
      { date: new Date('2026-01-01'), amount: 800 },
    ])
    expect(rate).not.toBeNull()
    expect(rate!).toBeLessThan(0)
  })
})
