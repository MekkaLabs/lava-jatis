// Business logic for the LAVAI loyalty system

export interface FidelidadeConfig {
  id?: string
  lava_jato_id?: string
  ativo: boolean
  pontos_por_real: number
  bonus_aniversario: number
  bonus_indicacao: number
  nivel_prata_pontos: number
  nivel_ouro_pontos: number
  nivel_diamante_pontos: number
  mensagem_boas_vindas: string
}

export const DEFAULT_CONFIG: FidelidadeConfig = {
  ativo: true,
  pontos_por_real: 1.0,
  bonus_aniversario: 100,
  bonus_indicacao: 50,
  nivel_prata_pontos: 500,
  nivel_ouro_pontos: 1500,
  nivel_diamante_pontos: 5000,
  mensagem_boas_vindas: 'Bem-vindo ao nosso programa de fidelidade!',
}

export function calcularNivel(pontosTotal: number, config: FidelidadeConfig): string {
  if (pontosTotal >= config.nivel_diamante_pontos) return 'diamante'
  if (pontosTotal >= config.nivel_ouro_pontos) return 'ouro'
  if (pontosTotal >= config.nivel_prata_pontos) return 'prata'
  return 'bronze'
}

export function calcularPontosGanhos(valorAtendimento: number, config: FidelidadeConfig): number {
  return Math.floor(valorAtendimento * config.pontos_por_real)
}

export function pontosParaProximoNivel(pontosTotal: number, config: FidelidadeConfig): { proximo: string; faltam: number } | null {
  if (pontosTotal < config.nivel_prata_pontos) {
    return { proximo: 'prata', faltam: config.nivel_prata_pontos - pontosTotal }
  }
  if (pontosTotal < config.nivel_ouro_pontos) {
    return { proximo: 'ouro', faltam: config.nivel_ouro_pontos - pontosTotal }
  }
  if (pontosTotal < config.nivel_diamante_pontos) {
    return { proximo: 'diamante', faltam: config.nivel_diamante_pontos - pontosTotal }
  }
  return null // already diamante
}

export const NIVEL_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  prata: '#C0C0C0',
  ouro: '#FFD700',
  diamante: '#00d4ff',
}

export const NIVEL_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  diamante: 'Diamante',
}

export const NIVEL_EMOJIS: Record<string, string> = {
  bronze: '🥉',
  prata: '🥈',
  ouro: '⭐',
  diamante: '💎',
}

export const TIPO_LABELS: Record<string, string> = {
  desconto: 'Desconto',
  servico_gratis: 'Serviço Grátis',
  brinde: 'Brinde',
}

export const TIPO_TRANSACAO_LABELS: Record<string, string> = {
  ganho: 'Pontos ganhos',
  resgate: 'Resgate',
  expiracao: 'Expiração',
  bonus: 'Bônus',
  ajuste: 'Ajuste manual',
}
