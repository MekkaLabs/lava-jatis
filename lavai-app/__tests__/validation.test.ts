import { describe, it, expect } from 'vitest'
import {
  ServicoSchema,
  ItemEstoqueSchema,
  MovimentacaoSchema,
} from '@/lib/validation'

describe('ServicoSchema — CRUD de serviço', () => {
  it('aceita um serviço válido', () => {
    const r = ServicoSchema.create({ nome: 'Lavagem Completa', preco: 60, duracao_minutos: 40 })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('exige nome', () => {
    const r = ServicoSchema.create({ preco: 60 })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/nome/)
  })

  it('aceita atualização parcial (só o preço)', () => {
    const r = ServicoSchema.update({ preco: 80 })
    expect(r.valid).toBe(true)
  })

  it('valida o tipo de ativo', () => {
    expect(ServicoSchema.update({ ativo: 'sim' as any }).valid).toBe(false)
    expect(ServicoSchema.update({ ativo: false }).valid).toBe(true)
  })
})

describe('ServicoSchema — validação de preço (>= 0)', () => {
  it('rejeita preço negativo', () => {
    const r = ServicoSchema.create({ nome: 'X', preco: -1 })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/preco/)
  })

  it('aceita preço zero', () => {
    expect(ServicoSchema.create({ nome: 'Cortesia', preco: 0 }).valid).toBe(true)
  })

  it('exige preço no create', () => {
    expect(ServicoSchema.create({ nome: 'X' }).valid).toBe(false)
  })

  it('rejeita preço negativo no update', () => {
    expect(ServicoSchema.update({ preco: -5 }).valid).toBe(false)
  })
})

describe('ItemEstoqueSchema', () => {
  it('aceita item válido', () => {
    expect(ItemEstoqueSchema.create({ nome: 'Shampoo', unidade: 'L', qtd_atual: 10, estoque_minimo: 2 }).valid).toBe(true)
  })
  it('rejeita unidade inválida', () => {
    expect(ItemEstoqueSchema.create({ nome: 'X', unidade: 'galao' }).valid).toBe(false)
  })
  it('rejeita quantidades negativas', () => {
    expect(ItemEstoqueSchema.create({ nome: 'X', estoque_minimo: -1 }).valid).toBe(false)
    expect(ItemEstoqueSchema.create({ nome: 'X', custo: -10 }).valid).toBe(false)
  })
})

describe('MovimentacaoSchema', () => {
  it('aceita movimentação válida', () => {
    expect(MovimentacaoSchema.create({ item_id: 'abc', tipo: 'entrada', quantidade: 5 }).valid).toBe(true)
  })
  it('exige item_id', () => {
    expect(MovimentacaoSchema.create({ tipo: 'saida', quantidade: 5 }).valid).toBe(false)
  })
  it('rejeita quantidade <= 0', () => {
    expect(MovimentacaoSchema.create({ item_id: 'abc', tipo: 'saida', quantidade: 0 }).valid).toBe(false)
  })
  it('rejeita tipo inválido', () => {
    expect(MovimentacaoSchema.create({ item_id: 'abc', tipo: 'ajuste', quantidade: 1 }).valid).toBe(false)
  })
})
