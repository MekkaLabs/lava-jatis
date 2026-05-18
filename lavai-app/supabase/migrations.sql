-- ============================================================
-- LAVAI — Migrations (rodar após schema.sql)
-- Adiciona colunas que o código espera mas não estão no schema base
-- ============================================================

-- ── lava_jatos ──────────────────────────────────────────────
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS plano_status text DEFAULT 'trial' CHECK (plano_status IN ('trial','ativo','inadimplente','cancelado'));
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS asaas_customer_id text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS asaas_subscription_id text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Relatório email
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS relatorio_email_ativo boolean DEFAULT true;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS relatorio_email_dia integer DEFAULT 1;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS relatorio_email_hora integer DEFAULT 8;

-- Sync owner_id → user_id (ambos são usados no código)
UPDATE lava_jatos SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;

-- ── servicos ─────────────────────────────────────────────────
-- Renomear duracao_min → duracao_minutos (o código usa duracao_minutos)
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS duracao_minutos int DEFAULT 30;
UPDATE servicos SET duracao_minutos = duracao_min WHERE duracao_minutos IS NULL;

-- ── atendimentos ─────────────────────────────────────────────
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS preco_final decimal(10,2);
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS valor_cobrado decimal(10,2);
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS modelo text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS modelo_veiculo text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS cor text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS observacao text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS data_hora timestamptz;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS funcionario_id uuid REFERENCES funcionarios(id);
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Sync preco → preco_final para compatibilidade
UPDATE atendimentos SET preco_final = preco WHERE preco_final IS NULL;
UPDATE atendimentos SET valor_cobrado = preco WHERE valor_cobrado IS NULL;

-- ── clientes ──────────────────────────────────────────────────
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS modelo_veiculo text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_atendimentos int DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_gasto decimal(10,2) DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ultima_visita timestamptz;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── funcionarios ──────────────────────────────────────────────
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS salario decimal(10,2);
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── despesas ─────────────────────────────────────────────────
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS pago boolean DEFAULT true;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS observacao text;

-- ============================================================
-- Indexes de performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_atendimentos_lava_jato    ON atendimentos(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status       ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_created_at   ON atendimentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data_hora    ON atendimentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_clientes_lava_jato        ON clientes(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone         ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_servicos_lava_jato        ON servicos(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_despesas_lava_jato        ON despesas(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data             ON despesas(data DESC);
CREATE INDEX IF NOT EXISTS idx_funcionarios_lava_jato    ON funcionarios(lava_jato_id);
