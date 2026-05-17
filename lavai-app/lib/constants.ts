// ============================================================
// LAVAI — App-wide constants
// ============================================================

// ── Plans ────────────────────────────────────────────────────

export const PLANS = {
  starter: {
    id: 'starter',
    nome: 'Starter',
    preco: 0,
    precoFormatado: 'Grátis',
    limiteAtendimentosMes: 100,
    limiteClientes: 200,
    limiteFuncionarios: 2,
    features: [
      'Fila ao vivo',
      'Até 100 atendimentos/mês',
      'Até 200 clientes',
      '2 funcionários',
      'Dashboard básico',
    ],
    cor: '#6b7280',
  },
  pro: {
    id: 'pro',
    nome: 'Pro',
    preco: 9700, // centavos BRL
    precoFormatado: 'R$ 97/mês',
    limiteAtendimentosMes: -1, // unlimited
    limiteClientes: -1,
    limiteFuncionarios: 10,
    features: [
      'Tudo do Starter',
      'Atendimentos ilimitados',
      'Clientes ilimitados',
      '10 funcionários',
      'Módulo financeiro',
      'Programa de fidelidade',
      'Relatórios avançados',
      'Notificações push',
    ],
    cor: '#00d4ff',
    destaque: true,
  },
  enterprise: {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 29700,
    precoFormatado: 'R$ 297/mês',
    limiteAtendimentosMes: -1,
    limiteClientes: -1,
    limiteFuncionarios: -1,
    features: [
      'Tudo do Pro',
      'Funcionários ilimitados',
      'Múltiplas unidades',
      'API de integração',
      'Suporte prioritário',
      'Onboarding dedicado',
    ],
    cor: '#ffd600',
  },
} as const

export type PlanId = keyof typeof PLANS

// ── Atendimento status ────────────────────────────────────────

export const STATUS_COLORS = {
  aguardando:   '#ffd600',
  em_andamento: '#00d4ff',
  concluido:    '#00e676',
  cancelado:    '#ff5252',
} as const

export const STATUS_BG = {
  aguardando:   'rgba(255,214,0,0.12)',
  em_andamento: 'rgba(0,212,255,0.12)',
  concluido:    'rgba(0,230,118,0.12)',
  cancelado:    'rgba(255,82,82,0.12)',
} as const

export const STATUS_LABELS = {
  aguardando:   'Aguardando',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
} as const

export type AtendStatus = keyof typeof STATUS_LABELS

// ── Despesa categories ────────────────────────────────────────

export const CATEGORIAS_DESPESA = [
  { value: 'produto',      label: 'Produto / Insumo',   emoji: '🧴' },
  { value: 'funcionario',  label: 'Funcionário / RH',    emoji: '👤' },
  { value: 'energia',      label: 'Energia / Água',      emoji: '💡' },
  { value: 'manutencao',   label: 'Manutenção',          emoji: '🔧' },
  { value: 'aluguel',      label: 'Aluguel',             emoji: '🏠' },
  { value: 'marketing',    label: 'Marketing',           emoji: '📣' },
  { value: 'equipamento',  label: 'Equipamento',         emoji: '🏗️' },
  { value: 'outro',        label: 'Outro',               emoji: '📦' },
] as const

export type CategoriaDespesa = (typeof CATEGORIAS_DESPESA)[number]['value']

// ── Payment methods ───────────────────────────────────────────

export const FORMAS_PAGAMENTO = [
  { value: 'pix',            label: 'Pix',             emoji: '⚡' },
  { value: 'dinheiro',       label: 'Dinheiro',        emoji: '💵' },
  { value: 'cartao_credito', label: 'Cartão de crédito', emoji: '💳' },
  { value: 'cartao_debito',  label: 'Cartão de débito',  emoji: '💳' },
  { value: 'transferencia',  label: 'Transferência',   emoji: '🏦' },
] as const

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]['value']

// ── Employee roles ────────────────────────────────────────────

export const CARGOS_FUNCIONARIO = [
  { value: 'lavador',     label: 'Lavador' },
  { value: 'polidor',     label: 'Polidor' },
  { value: 'detalhista',  label: 'Detalhista' },
  { value: 'caixa',       label: 'Caixa / Atendente' },
  { value: 'gerente',     label: 'Gerente' },
  { value: 'outro',       label: 'Outro' },
] as const

export type CargoFuncionario = (typeof CARGOS_FUNCIONARIO)[number]['value']

// ── Default services for onboarding ──────────────────────────

export const SERVICOS_DEFAULTS = [
  { nome: 'Lavagem Simples',       preco: 3000,  duracao_min: 20, emoji: '🚿' },
  { nome: 'Lavagem Completa',      preco: 5000,  duracao_min: 35, emoji: '✨' },
  { nome: 'Lavagem + Aspiração',   preco: 6000,  duracao_min: 45, emoji: '🧹' },
  { nome: 'Polimento',             preco: 15000, duracao_min: 90, emoji: '💎' },
  { nome: 'Higienização Interna',  preco: 12000, duracao_min: 60, emoji: '🪣' },
  { nome: 'Lavagem de Motor',      preco: 8000,  duracao_min: 40, emoji: '⚙️' },
  { nome: 'Cristalização',         preco: 20000, duracao_min: 120, emoji: '🔮' },
] as const

// ── Fidelity levels ───────────────────────────────────────────

export const FIDELIDADE_NIVEIS = {
  bronze:    { label: 'Bronze',   min: 0,    cor: '#cd7f32', emoji: '🥉' },
  prata:     { label: 'Prata',    min: 500,  cor: '#c0c0c0', emoji: '🥈' },
  ouro:      { label: 'Ouro',     min: 1500, cor: '#ffd700', emoji: '🥇' },
  diamante:  { label: 'Diamante', min: 5000, cor: '#00d4ff', emoji: '💎' },
} as const

export type FidelidadeNivel = keyof typeof FIDELIDADE_NIVEIS

// ── App metadata ──────────────────────────────────────────────

export const APP_NAME = 'LAVAI'
export const APP_TAGLINE = 'O sistema que faz seu lava-jato crescer'
export const APP_URL = 'https://lavai.app'
export const SUPPORT_EMAIL = 'suporte@lavai.app'
export const SUPPORT_WHATSAPP = '5511999999999'

// ── Realtime ─────────────────────────────────────────────────

export const REALTIME_CHANNEL_FILA = 'atendimentos-fila'
export const CACHE_TTL_DASHBOARD = 60_000  // 60 seconds
export const CACHE_TTL_STATS = 30_000      // 30 seconds
export const DEBOUNCE_SEARCH_MS = 300
