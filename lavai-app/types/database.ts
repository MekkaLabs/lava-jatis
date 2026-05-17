export interface LavaJato {
  id: string
  owner_id: string
  nome: string
  cidade: string | null
  whatsapp: string | null
  horario_abertura: string
  horario_fechamento: string
  plano: 'starter' | 'pro' | 'enterprise'
  ativo: boolean
  created_at: string
}

export interface Servico {
  id: string
  lava_jato_id: string
  nome: string
  preco: number
  duracao_min: number
  ativo: boolean
}

export interface Cliente {
  id: string
  lava_jato_id: string
  nome: string
  telefone: string | null
  placa: string | null
  pontos: number
  nivel: string
  created_at: string
}

export interface Atendimento {
  id: string
  lava_jato_id: string
  cliente_id: string | null
  cliente_nome: string
  placa: string
  servico_id: string | null
  servico_nome: string
  preco: number
  status: 'aguardando' | 'em_andamento' | 'concluido' | 'cancelado'
  funcionario: string | null
  forma_pagamento: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | null
  created_at: string
  concluido_at: string | null
}

export interface Despesa {
  id: string
  lava_jato_id: string
  descricao: string
  valor: number
  categoria: 'produto' | 'funcionario' | 'energia' | 'manutencao' | 'outro' | null
  data: string
}

export interface Funcionario {
  id: string
  lava_jato_id: string
  nome: string
  cargo: string
  ativo: boolean
  created_at: string
}
