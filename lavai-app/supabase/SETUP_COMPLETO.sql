-- ============================================================
-- LAVAI — SETUP COMPLETO (Schema único, idempotente)
-- ============================================================
-- Rodar UMA VEZ no Supabase SQL Editor.
--
-- Este script é IDEMPOTENTE: pode ser rodado em
--   (a) banco vazio (instalação nova), ou
--   (b) banco antigo que tem owner_id (migra automaticamente para user_id)
--
-- Padrão canônico: a coluna de dono em lava_jatos é `user_id`.
-- ============================================================


-- ============================================================
-- SECTION 1: COMPATIBILITY MIGRATION
-- Migra schemas antigos que usavam `owner_id` para o padrão `user_id`.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lava_jatos'
      AND column_name = 'owner_id'
  ) THEN
    -- Garante que user_id existe
    ALTER TABLE lava_jatos
      ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Copia owner_id → user_id onde ainda não foi sincronizado
    UPDATE lava_jatos
       SET user_id = owner_id
     WHERE user_id IS NULL AND owner_id IS NOT NULL;

    -- Drop policies antigas que referenciam owner_id (recriadas adiante)
    DROP POLICY IF EXISTS "Owner full access" ON lava_jatos;
    DROP POLICY IF EXISTS "Owner full access" ON servicos;
    DROP POLICY IF EXISTS "Owner full access" ON clientes;
    DROP POLICY IF EXISTS "Owner full access" ON atendimentos;
    DROP POLICY IF EXISTS "Owner full access" ON despesas;
    DROP POLICY IF EXISTS "Owner full access" ON funcionarios;
    DROP POLICY IF EXISTS "owner_pontos_clientes" ON pontos_clientes;
    DROP POLICY IF EXISTS "owner_pontos_transacoes" ON pontos_transacoes;
    DROP POLICY IF EXISTS "owner_recompensas" ON recompensas;
    DROP POLICY IF EXISTS "owner_resgates" ON resgates;
    DROP POLICY IF EXISTS "owner_fidelidade_config" ON fidelidade_config;
    DROP POLICY IF EXISTS "owner_whatsapp" ON whatsapp_conversas;
    DROP POLICY IF EXISTS "owner_mensagens" ON whatsapp_mensagens;
    DROP POLICY IF EXISTS "owner_config" ON whatsapp_config;

    -- Remove owner_id agora que tudo aponta para user_id
    ALTER TABLE lava_jatos DROP COLUMN owner_id;
  END IF;
END$$;


-- ============================================================
-- SECTION 2: CORE TABLES
-- ============================================================

-- ── lava_jatos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lava_jatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cidade text,
  estado text,
  endereco text,
  whatsapp text,
  logo_url text,
  horario_abertura time DEFAULT '08:00',
  horario_fechamento time DEFAULT '18:00',
  plano text DEFAULT 'starter' CHECK (plano IN ('starter','pro','enterprise')),
  plano_status text DEFAULT 'trial' CHECK (plano_status IN ('trial','ativo','inadimplente','cancelado')),
  asaas_customer_id text,
  asaas_subscription_id text,
  relatorio_email_ativo boolean DEFAULT true,
  relatorio_email_dia integer DEFAULT 1,
  relatorio_email_hora integer DEFAULT 8,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Garante todas as colunas existem em bancos antigos
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS plano_status text DEFAULT 'trial' CHECK (plano_status IN ('trial','ativo','inadimplente','cancelado'));
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS asaas_customer_id text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS asaas_subscription_id text;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS relatorio_email_ativo boolean DEFAULT true;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS relatorio_email_dia integer DEFAULT 1;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS relatorio_email_hora integer DEFAULT 8;
ALTER TABLE lava_jatos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- ── servicos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  preco decimal(10,2) NOT NULL,
  duracao_minutos integer DEFAULT 30,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE servicos ADD COLUMN IF NOT EXISTS duracao_minutos integer DEFAULT 30;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
-- Migra duracao_min → duracao_minutos se schema antigo
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='servicos' AND column_name='duracao_min') THEN
    UPDATE servicos SET duracao_minutos = duracao_min WHERE duracao_minutos IS NULL;
  END IF;
END$$;


-- ── clientes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text,
  email text,
  placa text,
  modelo_veiculo text,
  pontos integer DEFAULT 0,
  nivel text DEFAULT 'bronze',
  total_atendimentos integer DEFAULT 0,
  total_gasto decimal(10,2) DEFAULT 0,
  ultima_visita timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS modelo_veiculo text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_atendimentos integer DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_gasto decimal(10,2) DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ultima_visita timestamptz;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- ── atendimentos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL,
  placa text NOT NULL,
  modelo text,
  modelo_veiculo text,
  cor text,
  servico_id uuid REFERENCES servicos(id) ON DELETE SET NULL,
  servico_nome text NOT NULL,
  preco decimal(10,2) NOT NULL,
  preco_final decimal(10,2),
  valor_cobrado decimal(10,2),
  funcionario text,
  funcionario_id uuid REFERENCES funcionarios(id) ON DELETE SET NULL,
  status text DEFAULT 'aguardando' CHECK (status IN ('aguardando','em_andamento','concluido','cancelado')),
  forma_pagamento text CHECK (forma_pagamento IN ('pix','cartao_credito','cartao_debito','dinheiro')),
  observacao text,
  data_hora timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  concluido_at timestamptz
);

ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS preco_final decimal(10,2);
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS valor_cobrado decimal(10,2);
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS modelo text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS modelo_veiculo text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS cor text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS observacao text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS data_hora timestamptz;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS funcionario_id uuid REFERENCES funcionarios(id) ON DELETE SET NULL;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
-- Sincroniza preco → preco_final e valor_cobrado quando vazio
UPDATE atendimentos SET preco_final = preco WHERE preco_final IS NULL;
UPDATE atendimentos SET valor_cobrado = preco WHERE valor_cobrado IS NULL;


-- ── despesas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor decimal(10,2) NOT NULL,
  categoria text CHECK (categoria IN ('produto','funcionario','energia','manutencao','outro')),
  data date DEFAULT current_date,
  pago boolean DEFAULT true,
  observacao text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE despesas ADD COLUMN IF NOT EXISTS pago boolean DEFAULT true;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS observacao text;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- ── funcionarios ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cargo text DEFAULT 'lavador',
  telefone text,
  email text,
  salario decimal(10,2),
  foto_url text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS salario decimal(10,2);
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- ============================================================
-- SECTION 3: LOYALTY (FIDELIDADE)
-- ============================================================

CREATE TABLE IF NOT EXISTS pontos_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  pontos_total integer DEFAULT 0,
  pontos_disponiveis integer DEFAULT 0,
  nivel text DEFAULT 'bronze' CHECK (nivel IN ('bronze','prata','ouro','diamante')),
  total_gasto decimal(10,2) DEFAULT 0,
  total_atendimentos integer DEFAULT 0,
  ultima_visita timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lava_jato_id, cliente_id)
);

CREATE TABLE IF NOT EXISTS pontos_transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  atendimento_id uuid REFERENCES atendimentos(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('ganho','resgate','expiracao','bonus','ajuste')),
  pontos integer NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recompensas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  pontos_necessarios integer NOT NULL,
  tipo text DEFAULT 'desconto' CHECK (tipo IN ('desconto','servico_gratis','brinde')),
  valor_desconto decimal(10,2),
  ativo boolean DEFAULT true,
  estoque integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resgates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  recompensa_id uuid NOT NULL REFERENCES recompensas(id) ON DELETE CASCADE,
  pontos_usados integer NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','utilizado','cancelado')),
  codigo_resgate text UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at timestamptz DEFAULT now(),
  utilizado_at timestamptz
);

CREATE TABLE IF NOT EXISTS fidelidade_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE UNIQUE,
  ativo boolean DEFAULT true,
  pontos_por_real decimal(5,2) DEFAULT 1.0,
  bonus_aniversario integer DEFAULT 100,
  bonus_indicacao integer DEFAULT 50,
  nivel_prata_pontos integer DEFAULT 500,
  nivel_ouro_pontos integer DEFAULT 1500,
  nivel_diamante_pontos integer DEFAULT 5000,
  mensagem_boas_vindas text DEFAULT 'Bem-vindo ao nosso programa de fidelidade!',
  created_at timestamptz DEFAULT now()
);


-- ============================================================
-- SECTION 4: WHATSAPP BOT
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  telefone text NOT NULL,
  estado text DEFAULT 'inicio',
  contexto jsonb DEFAULT '{}',
  ultima_mensagem_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(lava_jato_id, telefone)
);

CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  telefone text NOT NULL,
  direcao text NOT NULL CHECK (direcao IN ('entrada','saida')),
  mensagem text NOT NULL,
  estado_conversa text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE UNIQUE,
  zapi_instance_id text,
  zapi_token text,
  zapi_client_token text,
  numero_whatsapp text,
  ativo boolean DEFAULT false,
  horario_inicio time DEFAULT '08:00',
  horario_fim time DEFAULT '18:00',
  mensagem_fora_horario text DEFAULT 'Olá! Estamos fora do horário de atendimento. Funcionamos das 8h às 18h.',
  created_at timestamptz DEFAULT now()
);


-- ============================================================
-- SECTION 5: NPS
-- ============================================================
-- Links de avaliação são HMAC-signed pelo app (lib/nps-signature).
-- Endpoints públicos usam service role após validar a assinatura,
-- então RLS bloqueia QUALQUER acesso direto do anon.

CREATE TABLE IF NOT EXISTS nps_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  atendimento_id uuid REFERENCES atendimentos(id) ON DELETE SET NULL,
  cliente_nome text,
  telefone text,
  nota integer NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(atendimento_id)
);

-- Garante unique constraint mesmo em bancos antigos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'nps_avaliacoes' AND constraint_name = 'nps_avaliacoes_atendimento_id_key'
  ) THEN
    ALTER TABLE nps_avaliacoes ADD CONSTRAINT nps_avaliacoes_atendimento_id_key UNIQUE (atendimento_id);
  END IF;
END$$;


-- ============================================================
-- SECTION 6: PUSH NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subscription)
);


-- ============================================================
-- SECTION 7: WEBHOOK EVENTS (idempotência — task #10)
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  payload jsonb,
  processed_at timestamptz DEFAULT now(),
  UNIQUE(provider, event_id)
);


-- ============================================================
-- SECTION 7B: LGPD — Solicitações de exclusão / acesso
-- ============================================================

CREATE TABLE IF NOT EXISTS solicitacoes_lgpd (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('exclusao','acesso','correcao','portabilidade','revogacao')),
  telefone text,
  email text,
  motivo text,
  ip text,
  user_agent text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','em_analise','concluida','rejeitada')),
  observacao_interna text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_status   ON solicitacoes_lgpd(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_telefone ON solicitacoes_lgpd(telefone);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_email    ON solicitacoes_lgpd(email);


-- ============================================================
-- SECTION 8: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE lava_jatos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_clientes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_transacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompensas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resgates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelidade_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensagens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_avaliacoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_lgpd   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 9: POLICIES (todas em user_id — idempotente DROP+CREATE)
-- ============================================================

-- lava_jatos: dono é o usuário autenticado
DROP POLICY IF EXISTS "lava_jatos_owner" ON lava_jatos;
CREATE POLICY "lava_jatos_owner" ON lava_jatos
  FOR ALL USING (user_id = auth.uid());

-- Tabelas filhas: acesso via lava_jato_id que pertence ao usuário
DROP POLICY IF EXISTS "servicos_owner" ON servicos;
CREATE POLICY "servicos_owner" ON servicos
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "clientes_owner" ON clientes;
CREATE POLICY "clientes_owner" ON clientes
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "atendimentos_owner" ON atendimentos;
CREATE POLICY "atendimentos_owner" ON atendimentos
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "despesas_owner" ON despesas;
CREATE POLICY "despesas_owner" ON despesas
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "funcionarios_owner" ON funcionarios;
CREATE POLICY "funcionarios_owner" ON funcionarios
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

-- Fidelidade
DROP POLICY IF EXISTS "pontos_clientes_owner" ON pontos_clientes;
CREATE POLICY "pontos_clientes_owner" ON pontos_clientes
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "pontos_transacoes_owner" ON pontos_transacoes;
CREATE POLICY "pontos_transacoes_owner" ON pontos_transacoes
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "recompensas_owner" ON recompensas;
CREATE POLICY "recompensas_owner" ON recompensas
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "resgates_owner" ON resgates;
CREATE POLICY "resgates_owner" ON resgates
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "fidelidade_config_owner" ON fidelidade_config;
CREATE POLICY "fidelidade_config_owner" ON fidelidade_config
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

-- WhatsApp
DROP POLICY IF EXISTS "whatsapp_conversas_owner" ON whatsapp_conversas;
CREATE POLICY "whatsapp_conversas_owner" ON whatsapp_conversas
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "whatsapp_mensagens_owner" ON whatsapp_mensagens;
CREATE POLICY "whatsapp_mensagens_owner" ON whatsapp_mensagens
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "whatsapp_config_owner" ON whatsapp_config;
CREATE POLICY "whatsapp_config_owner" ON whatsapp_config
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

-- NPS: dono lê suas próprias avaliações. Anon NÃO faz INSERT/UPDATE direto —
-- o endpoint /api/public/nps-avaliar valida HMAC e usa service role pra gravar.
DROP POLICY IF EXISTS "nps_select_owner" ON nps_avaliacoes;
DROP POLICY IF EXISTS "nps_insert_public" ON nps_avaliacoes;
DROP POLICY IF EXISTS "nps_update_public" ON nps_avaliacoes;

CREATE POLICY "nps_select_owner" ON nps_avaliacoes
  FOR SELECT USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));
-- Sem policy de INSERT/UPDATE pra anon: tudo passa via service role no app.

-- Push subscriptions: apenas o próprio usuário
DROP POLICY IF EXISTS "push_subscriptions_owner" ON push_subscriptions;
CREATE POLICY "push_subscriptions_owner" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Webhook events: apenas service role (sem policy para anon/authenticated)
-- RLS habilitada sem policy = nada passa exceto service_role (bypassa RLS por design)


-- ============================================================
-- SECTION 10: INDEXES
-- ============================================================

-- lava_jatos: lookup por user_id (executado em toda API request)
CREATE INDEX IF NOT EXISTS idx_lava_jatos_user_id           ON lava_jatos(user_id);

-- atendimentos: fila ao vivo + dashboard + receita
CREATE INDEX IF NOT EXISTS idx_atendimentos_lava_jato       ON atendimentos(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status          ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_created_at      ON atendimentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data_hora       ON atendimentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_atendimentos_lava_jato_status  ON atendimentos(lava_jato_id, status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_lava_jato_created ON atendimentos(lava_jato_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status_created   ON atendimentos(lava_jato_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atendimentos_cliente_id       ON atendimentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_placa            ON atendimentos(lava_jato_id, placa);

-- clientes: busca + listagem + dedupe
CREATE INDEX IF NOT EXISTS idx_clientes_lava_jato            ON clientes(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone             ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_lava_jato_nome       ON clientes(lava_jato_id, nome);
CREATE INDEX IF NOT EXISTS idx_clientes_lava_jato_created    ON clientes(lava_jato_id, created_at DESC);
-- Full-text search
CREATE INDEX IF NOT EXISTS idx_clientes_fts ON clientes USING gin(
  to_tsvector('portuguese', nome || ' ' || COALESCE(telefone, '') || ' ' || COALESCE(placa, ''))
);

-- servicos, despesas, funcionarios
CREATE INDEX IF NOT EXISTS idx_servicos_lava_jato            ON servicos(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_servicos_lava_jato_ativo      ON servicos(lava_jato_id, ativo);
CREATE INDEX IF NOT EXISTS idx_despesas_lava_jato            ON despesas(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_despesas_lava_jato_data       ON despesas(lava_jato_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_lava_jato_created    ON despesas(lava_jato_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funcionarios_lava_jato        ON funcionarios(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_lava_jato_ativo  ON funcionarios(lava_jato_id, ativo);

-- whatsapp
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_lava_jato  ON whatsapp_conversas(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_telefone   ON whatsapp_conversas(telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_lava_jato  ON whatsapp_mensagens(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_telefone   ON whatsapp_mensagens(telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_created    ON whatsapp_mensagens(created_at DESC);

-- nps
CREATE INDEX IF NOT EXISTS idx_nps_lava_jato                 ON nps_avaliacoes(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_nps_atendimento               ON nps_avaliacoes(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_nps_nota                      ON nps_avaliacoes(nota);
CREATE INDEX IF NOT EXISTS idx_nps_created_at                ON nps_avaliacoes(created_at DESC);

-- push
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx       ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_lava_jato_id_idx  ON push_subscriptions(lava_jato_id);

-- webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider       ON webhook_events(provider, event_id);


-- ============================================================
-- SECTION 11: TRIGGERS (updated_at automático)
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON lava_jatos;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON lava_jatos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON clientes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON atendimentos;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON funcionarios;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON funcionarios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON pontos_clientes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pontos_clientes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- DONE
-- Verifique no painel Supabase que todas as tabelas estão criadas
-- e que RLS está habilitada (escudo verde no Table Editor).
-- ============================================================


-- ============================================================
-- SECTION 12: SUPER ADMIN (visão acima dos donos)
-- ============================================================
-- Tabela separada (não usa role em auth.users.metadata pra evitar bypass via API).
-- Apenas user_ids listados aqui têm acesso a /admin (lista de lava-jatos + planos).

CREATE TABLE IF NOT EXISTS super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Só o próprio super-admin lê sua linha (não expõe lista pra outros)
DROP POLICY IF EXISTS "super_admins_self" ON super_admins;
CREATE POLICY "super_admins_self" ON super_admins
  FOR SELECT USING (user_id = auth.uid());

-- Inserções/manutenção apenas via service role (não há policy de INSERT/UPDATE/DELETE).

-- View que os super-admins consultam: lista de lava-jatos com plano e métricas básicas.
-- Como super-admin não tem RLS de lava_jatos (não é dono), a leitura passa por uma
-- RPC SECURITY DEFINER abaixo (controlada).

CREATE OR REPLACE FUNCTION admin_list_lava_jatos()
RETURNS TABLE (
  id uuid,
  nome text,
  cidade text,
  estado text,
  plano text,
  plano_status text,
  ativo boolean,
  created_at timestamptz,
  total_atendimentos bigint,
  total_clientes bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp  -- previne hijack de search_path em SECURITY DEFINER (CVE clássica Postgres)
AS $$
BEGIN
  -- só executa se o caller for super-admin
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: not super admin';
  END IF;

  RETURN QUERY
  SELECT
    lj.id, lj.nome, lj.cidade, lj.estado, lj.plano, lj.plano_status, lj.ativo, lj.created_at,
    COALESCE((SELECT count(*) FROM atendimentos a WHERE a.lava_jato_id = lj.id), 0)::bigint,
    COALESCE((SELECT count(*) FROM clientes c WHERE c.lava_jato_id = lj.id), 0)::bigint
  FROM lava_jatos lj
  ORDER BY lj.created_at DESC;
END;
$$;

-- Defesa em profundidade: nega EXECUTE pra PUBLIC (default Postgres) e libera só pra authenticated.
-- Mesmo com o guard interno, evita que anon (sem JWT) consiga sequer chamar a função.
REVOKE EXECUTE ON FUNCTION admin_list_lava_jatos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_list_lava_jatos() TO authenticated;

-- COMO PROMOVER UM USUÁRIO A SUPER-ADMIN (rodar manualmente no SQL Editor):
--   INSERT INTO super_admins (user_id, email)
--   SELECT id, email FROM auth.users WHERE email = 'gustav0.v1c3nt3@gmail.com';
