// ============================================================
// LAVAI — Demo Mode
// Dados mock para visualização sem Supabase configurado
// ============================================================
//
// REGRAS:
//   • Em produção (NODE_ENV=production), demo só ativa com
//     NEXT_PUBLIC_LAVAI_DEMO_ENABLED='true' EXPLÍCITO.
//   • Em dev/preview, demo ativa se a flag estiver presente OU
//     se NEXT_PUBLIC_SUPABASE_URL estiver ausente / placeholder.
//
// Isso elimina o risco de "rollback de env var em prod → qualquer um
// logado com admin/Am0cmph3@".
// ============================================================

function computeIsDemo(): boolean {
  const flag = (process.env.NEXT_PUBLIC_LAVAI_DEMO_ENABLED ?? '').toLowerCase() === 'true'
  if (process.env.NODE_ENV === 'production') return flag
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const noRealUrl = !url || url.includes('seu-projeto')
  return flag || noRealUrl
}

export const IS_DEMO = computeIsDemo()

/** Credencial demo (apenas usada quando IS_DEMO=true). */
export const DEMO_CREDENTIALS = {
  login: 'admin',
  password: 'Am0cmph3@',
} as const

// ── Fila ─────────────────────────────────────────────────────
export const DEMO_ATENDIMENTOS = [
  { id: 'd1', cliente_nome: 'Carlos Silva',   servico_nome: 'Lavagem Completa', servico_id: 's1', placa: 'ABC-1234', modelo: 'Chevrolet Onix',   status: 'em_andamento' as const, preco_final: 60,  created_at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 'd2', cliente_nome: 'Ana Souza',       servico_nome: 'Polimento',        servico_id: 's2', placa: 'DEF-5678', modelo: 'Hyundai HB20',    status: 'aguardando'   as const, preco_final: 150, created_at: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: 'd3', cliente_nome: 'Roberto Nunes',   servico_nome: 'Lavagem Simples',  servico_id: 's3', placa: 'GHI-9012', modelo: 'Volkswagen Gol',  status: 'aguardando'   as const, preco_final: 30,  created_at: new Date(Date.now() -  5 * 60000).toISOString() },
  { id: 'd4', cliente_nome: 'Fernanda Lima',   servico_nome: 'Higienização',     servico_id: 's4', placa: 'JKL-3456', modelo: 'Toyota Corolla',  status: 'aguardando'   as const, preco_final: 180, created_at: new Date(Date.now() -  2 * 60000).toISOString() },
  { id: 'd5', cliente_nome: 'Marcos Andrade',  servico_nome: 'Lavagem + Cera',   servico_id: 's5', placa: 'MNO-7890', modelo: 'Ford Ka',         status: 'aguardando'   as const, preco_final: 90,  created_at: new Date(Date.now() -  1 * 60000).toISOString() },
]

export const DEMO_SERVICOS = [
  { id: 's1', nome: 'Lavagem Simples',   preco: 30  },
  { id: 's2', nome: 'Lavagem Completa',  preco: 60  },
  { id: 's3', nome: 'Polimento',         preco: 150 },
  { id: 's4', nome: 'Higienização',      preco: 180 },
  { id: 's5', nome: 'Lavagem + Cera',    preco: 90  },
  { id: 's6', nome: 'Cristalização',     preco: 250 },
]

// ── Clientes ─────────────────────────────────────────────────
export const DEMO_CLIENTES = [
  { id: 'c1', nome: 'Carlos Silva',   telefone: '(11) 99999-1111', email: 'carlos@email.com', placa: 'ABC-1234', pontos: 320, nivel: 'ouro',     total_atendimentos: 18, total_gasto: 1080, ultima_visita: new Date(Date.now() - 2 * 86400000).toISOString(), created_at: new Date(Date.now() - 180 * 86400000).toISOString() },
  { id: 'c2', nome: 'Ana Souza',      telefone: '(11) 99999-2222', email: 'ana@email.com',    placa: 'DEF-5678', pontos: 150, nivel: 'prata',    total_atendimentos: 9,  total_gasto:  540, ultima_visita: new Date(Date.now() - 5 * 86400000).toISOString(), created_at: new Date(Date.now() - 90  * 86400000).toISOString() },
  { id: 'c3', nome: 'Roberto Nunes',  telefone: '(11) 99999-3333', email: null,               placa: 'GHI-9012', pontos: 80,  nivel: 'bronze',   total_atendimentos: 5,  total_gasto:  300, ultima_visita: new Date(Date.now() - 1 * 86400000).toISOString(), created_at: new Date(Date.now() - 60  * 86400000).toISOString() },
  { id: 'c4', nome: 'Fernanda Lima',  telefone: '(11) 99999-4444', email: 'fe@email.com',     placa: 'JKL-3456', pontos: 520, nivel: 'diamante', total_atendimentos: 32, total_gasto: 1920, ultima_visita: new Date(Date.now() - 0 * 86400000).toISOString(), created_at: new Date(Date.now() - 365 * 86400000).toISOString() },
  { id: 'c5', nome: 'Marcos Andrade', telefone: '(11) 99999-5555', email: null,               placa: 'MNO-7890', pontos: 40,  nivel: 'bronze',   total_atendimentos: 3,  total_gasto:  180, ultima_visita: new Date(Date.now() - 7 * 86400000).toISOString(), created_at: new Date(Date.now() - 30  * 86400000).toISOString() },
  { id: 'c6', nome: 'Juliana Costa',  telefone: '(11) 99999-6666', email: 'ju@email.com',     placa: 'PQR-1122', pontos: 200, nivel: 'prata',    total_atendimentos: 12, total_gasto:  720, ultima_visita: new Date(Date.now() - 3 * 86400000).toISOString(), created_at: new Date(Date.now() - 120 * 86400000).toISOString() },
]

// ── Financeiro ────────────────────────────────────────────────
export const DEMO_RECEITA_7D = [
  { date: 'Seg', receita: 1240, despesas: 320 },
  { date: 'Ter', receita: 980,  despesas: 180 },
  { date: 'Qua', receita: 1560, despesas: 420 },
  { date: 'Qui', receita: 2100, despesas: 280 },
  { date: 'Sex', receita: 1870, despesas: 350 },
  { date: 'Sáb', receita: 2640, despesas: 190 },
  { date: 'Dom', receita: 890,  despesas: 120 },
]

export const DEMO_DESPESAS = [
  { id: 'e1', descricao: 'Produto de limpeza',  valor: 280,  categoria: 'produto',    data: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'e2', descricao: 'Salário João',        valor: 1800, categoria: 'funcionario', data: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'e3', descricao: 'Conta de energia',    valor: 420,  categoria: 'energia',     data: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'e4', descricao: 'Manutenção lavadora', valor: 350,  categoria: 'manutencao',  data: new Date(Date.now() - 5 * 86400000).toISOString() },
]

// ── Equipe ────────────────────────────────────────────────────
export const DEMO_FUNCIONARIOS = [
  { id: 'f1', nome: 'João Santos',    cargo: 'lavador',   ativo: true,  telefone: '(11) 98888-1111', created_at: new Date(Date.now() - 365 * 86400000).toISOString() },
  { id: 'f2', nome: 'Pedro Oliveira', cargo: 'lavador',   ativo: true,  telefone: '(11) 98888-2222', created_at: new Date(Date.now() - 180 * 86400000).toISOString() },
  { id: 'f3', nome: 'Marcos Costa',  cargo: 'gerente',   ativo: true,  telefone: '(11) 98888-3333', created_at: new Date(Date.now() - 90  * 86400000).toISOString() },
  { id: 'f4', nome: 'Lucas Ferreira',cargo: 'polidor',   ativo: false, telefone: '(11) 98888-4444', created_at: new Date(Date.now() - 200 * 86400000).toISOString() },
]

// ── Agendamentos ──────────────────────────────────────────────
const hoje = new Date()
const d = (days: number, hour: number) => {
  const dt = new Date(hoje)
  dt.setDate(dt.getDate() + days)
  dt.setHours(hour, 0, 0, 0)
  return dt.toISOString()
}

export const DEMO_AGENDAMENTOS = [
  { id: 'a1', cliente_nome: 'Carlos Silva',   servico_nome: 'Lavagem Completa', placa: 'ABC-1234', status: 'aguardando', preco_final: 60,  data_hora: d(0, 9)  },
  { id: 'a2', cliente_nome: 'Ana Souza',       servico_nome: 'Polimento',        placa: 'DEF-5678', status: 'aguardando', preco_final: 150, data_hora: d(0, 11) },
  { id: 'a3', cliente_nome: 'Fernanda Lima',   servico_nome: 'Higienização',     placa: 'JKL-3456', status: 'aguardando', preco_final: 180, data_hora: d(0, 14) },
  { id: 'a4', cliente_nome: 'Roberto Nunes',   servico_nome: 'Lavagem Simples',  placa: 'GHI-9012', status: 'aguardando', preco_final: 30,  data_hora: d(1, 9)  },
  { id: 'a5', cliente_nome: 'Juliana Costa',   servico_nome: 'Lavagem + Cera',   placa: 'PQR-1122', status: 'aguardando', preco_final: 90,  data_hora: d(1, 10) },
  { id: 'a6', cliente_nome: 'Marcos Andrade',  servico_nome: 'Cristalização',    placa: 'MNO-7890', status: 'aguardando', preco_final: 250, data_hora: d(2, 15) },
]
