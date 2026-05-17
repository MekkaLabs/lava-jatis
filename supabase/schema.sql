-- ============================================================
-- LAVAI — Schema Base
-- ============================================================

-- Tabela principal de lava-jatos
CREATE TABLE IF NOT EXISTS lava_jatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cidade TEXT,
  whatsapp TEXT,
  horario_abertura TEXT NOT NULL DEFAULT '08:00',
  horario_fechamento TEXT NOT NULL DEFAULT '18:00',
  plano TEXT NOT NULL DEFAULT 'basico'
    CHECK (plano IN ('basico', 'profissional', 'enterprise')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Serviços oferecidos
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  duracao_min INTEGER NOT NULL DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  placa TEXT,
  pontos INTEGER NOT NULL DEFAULT 0,
  nivel TEXT NOT NULL DEFAULT 'bronze',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atendimentos
CREATE TABLE IF NOT EXISTS atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  placa TEXT NOT NULL,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  servico_nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aguardando'
    CHECK (status IN ('aguardando', 'em_andamento', 'concluido', 'cancelado')),
  funcionario TEXT,
  forma_pagamento TEXT
    CHECK (forma_pagamento IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_at TIMESTAMPTZ
);

-- Despesas
CREATE TABLE IF NOT EXISTS despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  categoria TEXT
    CHECK (categoria IN ('produto', 'funcionario', 'energia', 'manutencao', 'outro')),
  data DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT 'lavador',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Adicionar colunas de pagamento à tabela lava_jatos
-- ============================================================

ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS plano_status TEXT DEFAULT 'trial'
  CHECK (plano_status IN ('trial', 'ativo', 'inadimplente', 'cancelado'));
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS plano_expires_at TIMESTAMPTZ;
