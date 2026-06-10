import { describe, it, expect } from 'vitest'
import {
  isEstoqueBaixo,
  itensEmAlerta,
  calcularNovoSaldo,
  validarMovimentacao,
} from '@/lib/estoque'

describe('calcularNovoSaldo', () => {
  it('soma na entrada', () => {
    expect(calcularNovoSaldo(10, 'entrada', 5)).toBe(15)
  })
  it('subtrai na saída', () => {
    expect(calcularNovoSaldo(10, 'saida', 4)).toBe(6)
  })
})

describe('validarMovimentacao — saldo após entrada/saída', () => {
  it('atualiza o saldo corretamente numa entrada', () => {
    const r = validarMovimentacao(10, 'entrada', 5)
    expect(r.valid).toBe(true)
    expect(r.novoSaldo).toBe(15)
  })

  it('atualiza o saldo corretamente numa saída', () => {
    const r = validarMovimentacao(10, 'saida', 7)
    expect(r.valid).toBe(true)
    expect(r.novoSaldo).toBe(3)
  })

  it('permite saída que zera o saldo (saldo 0 é válido)', () => {
    const r = validarMovimentacao(5, 'saida', 5)
    expect(r.valid).toBe(true)
    expect(r.novoSaldo).toBe(0)
  })
})

describe('validarMovimentacao — bloqueio de saldo negativo', () => {
  it('bloqueia saída maior que o saldo', () => {
    const r = validarMovimentacao(3, 'saida', 5)
    expect(r.valid).toBe(false)
    expect(r.novoSaldo).toBe(-2)
    expect(r.erro).toMatch(/saldo insuficiente/i)
  })

  it('rejeita quantidade zero ou negativa', () => {
    expect(validarMovimentacao(10, 'saida', 0).valid).toBe(false)
    expect(validarMovimentacao(10, 'entrada', -3).valid).toBe(false)
  })

  it('rejeita tipo inválido', () => {
    // @ts-expect-error tipo inválido proposital
    expect(validarMovimentacao(10, 'transferencia', 1).valid).toBe(false)
  })
})

describe('isEstoqueBaixo — disparo do alerta', () => {
  it('dispara quando saldo <= mínimo', () => {
    expect(isEstoqueBaixo({ qtd_atual: 2, estoque_minimo: 5 })).toBe(true)
    expect(isEstoqueBaixo({ qtd_atual: 5, estoque_minimo: 5 })).toBe(true)
  })

  it('não dispara quando saldo > mínimo', () => {
    expect(isEstoqueBaixo({ qtd_atual: 8, estoque_minimo: 5 })).toBe(false)
  })

  it('não dispara quando mínimo é 0 (sem controle de alerta)', () => {
    expect(isEstoqueBaixo({ qtd_atual: 0, estoque_minimo: 0 })).toBe(false)
  })
})

describe('itensEmAlerta', () => {
  it('filtra e ordena os itens mais críticos primeiro', () => {
    const itens = [
      { nome: 'A', qtd_atual: 8, estoque_minimo: 5 }, // ok
      { nome: 'B', qtd_atual: 1, estoque_minimo: 5 }, // -4 (mais crítico)
      { nome: 'C', qtd_atual: 4, estoque_minimo: 5 }, // -1
      { nome: 'D', qtd_atual: 0, estoque_minimo: 0 }, // sem controle
    ]
    const alerta = itensEmAlerta(itens)
    expect(alerta.map(i => i.nome)).toEqual(['B', 'C'])
  })
})
