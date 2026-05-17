-- ============================================================
-- LAVAI — Performance Indexes
-- Run these on your Supabase SQL editor for faster queries
-- ============================================================

-- Atendimentos: queries filtradas por lava_jato_id + status (fila ao vivo)
CREATE INDEX IF NOT EXISTS idx_atendimentos_lava_jato_status
  ON atendimentos(lava_jato_id, status);

-- Atendimentos: queries ordenadas por data (histórico, dashboard)
CREATE INDEX IF NOT EXISTS idx_atendimentos_lava_jato_created
  ON atendimentos(lava_jato_id, created_at DESC);

-- Atendimentos: queries agrupadas por dia (receita diária)
CREATE INDEX IF NOT EXISTS idx_atendimentos_lava_jato_date
  ON atendimentos(lava_jato_id, DATE(created_at));

-- Atendimentos: status + data (receita do mês por status=concluido)
CREATE INDEX IF NOT EXISTS idx_atendimentos_status_created
  ON atendimentos(lava_jato_id, status, created_at DESC);

-- Clientes: busca por nome dentro do lava_jato
CREATE INDEX IF NOT EXISTS idx_clientes_lava_jato_nome
  ON clientes(lava_jato_id, nome);

-- Clientes: busca por telefone (global, para deduplicação)
CREATE INDEX IF NOT EXISTS idx_clientes_telefone
  ON clientes(telefone);

-- Clientes: listagem por data de criação (clientes novos na semana)
CREATE INDEX IF NOT EXISTS idx_clientes_lava_jato_created
  ON clientes(lava_jato_id, created_at DESC);

-- Despesas: filtro por mês / data
CREATE INDEX IF NOT EXISTS idx_despesas_lava_jato_created
  ON despesas(lava_jato_id, created_at DESC);

-- Despesas: filtro por data (campo date)
CREATE INDEX IF NOT EXISTS idx_despesas_lava_jato_data
  ON despesas(lava_jato_id, data DESC);

-- Funcionários: lookup rápido por lava_jato
CREATE INDEX IF NOT EXISTS idx_funcionarios_lava_jato_ativo
  ON funcionarios(lava_jato_id, ativo);

-- Serviços: lookup rápido por lava_jato + ativo
CREATE INDEX IF NOT EXISTS idx_servicos_lava_jato_ativo
  ON servicos(lava_jato_id, ativo);

-- Full-text search em clientes (nome + telefone)
CREATE INDEX IF NOT EXISTS idx_clientes_fts
  ON clientes USING gin(
    to_tsvector('portuguese', nome || ' ' || COALESCE(telefone, '') || ' ' || COALESCE(placa, ''))
  );

-- Atendimentos: busca por cliente_id (histórico do cliente)
CREATE INDEX IF NOT EXISTS idx_atendimentos_cliente_id
  ON atendimentos(cliente_id);

-- Atendimentos: busca por placa
CREATE INDEX IF NOT EXISTS idx_atendimentos_placa
  ON atendimentos(lava_jato_id, placa);

-- Lava_jatos: lookup por user_id (autenticação — executado em toda API request)
CREATE INDEX IF NOT EXISTS idx_lava_jatos_user_id
  ON lava_jatos(user_id);
