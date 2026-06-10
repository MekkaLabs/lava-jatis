// ============================================================
// LAVAI — Lógica de estoque (funções puras, testáveis)
// Espelha as regras aplicadas atomicamente no banco
// (ver supabase/estoque_servicos_schema.sql → registrar_movimentacao_estoque).
// ============================================================

export const UNIDADES = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'par'] as const
export type Unidade = (typeof UNIDADES)[number]

export type TipoMovimentacao = 'entrada' | 'saida'

export interface ItemSaldo {
  qtd_atual: number
  estoque_minimo: number
}

/**
 * Item em alerta de estoque baixo: saldo menor ou igual ao mínimo
 * configurado. Mínimo 0 = sem controle de alerta (nunca alerta).
 */
export function isEstoqueBaixo(item: ItemSaldo): boolean {
  return item.estoque_minimo > 0 && item.qtd_atual <= item.estoque_minimo
}

/** Filtra apenas os itens em alerta, ordenados pelos mais críticos primeiro. */
export function itensEmAlerta<T extends ItemSaldo>(itens: T[]): T[] {
  return itens
    .filter(isEstoqueBaixo)
    .sort((a, b) => (a.qtd_atual - a.estoque_minimo) - (b.qtd_atual - b.estoque_minimo))
}

/** Novo saldo após a movimentação (sem validar — use validarMovimentacao antes). */
export function calcularNovoSaldo(
  saldoAtual: number,
  tipo: TipoMovimentacao,
  quantidade: number
): number {
  return tipo === 'entrada' ? saldoAtual + quantidade : saldoAtual - quantidade
}

export interface MovimentacaoValidacao {
  valid: boolean
  novoSaldo: number
  erro?: string
}

/**
 * Valida uma movimentação espelhando a função atômica do banco:
 *   • tipo deve ser 'entrada' ou 'saida'
 *   • quantidade deve ser positiva
 *   • o saldo resultante NUNCA pode ficar negativo
 */
export function validarMovimentacao(
  saldoAtual: number,
  tipo: TipoMovimentacao,
  quantidade: number
): MovimentacaoValidacao {
  if (tipo !== 'entrada' && tipo !== 'saida') {
    return { valid: false, novoSaldo: saldoAtual, erro: 'tipo inválido' }
  }
  if (typeof quantidade !== 'number' || isNaN(quantidade) || quantidade <= 0) {
    return { valid: false, novoSaldo: saldoAtual, erro: 'quantidade deve ser positiva' }
  }
  const novoSaldo = calcularNovoSaldo(saldoAtual, tipo, quantidade)
  if (novoSaldo < 0) {
    return { valid: false, novoSaldo, erro: 'saldo insuficiente: a saída deixaria o saldo negativo' }
  }
  return { valid: true, novoSaldo }
}
