-- Tabela de pontos por cliente
CREATE TABLE IF NOT EXISTS pontos_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  pontos_total INTEGER DEFAULT 0,
  pontos_disponiveis INTEGER DEFAULT 0,
  nivel TEXT DEFAULT 'bronze' CHECK (nivel IN ('bronze', 'prata', 'ouro', 'diamante')),
  total_gasto DECIMAL(10,2) DEFAULT 0,
  total_atendimentos INTEGER DEFAULT 0,
  ultima_visita TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lava_jato_id, cliente_id)
);

-- Histórico de transações de pontos
CREATE TABLE IF NOT EXISTS pontos_transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  atendimento_id UUID REFERENCES atendimentos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ganho', 'resgate', 'expiracao', 'bonus', 'ajuste')),
  pontos INTEGER NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recompensas disponíveis
CREATE TABLE IF NOT EXISTS recompensas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  pontos_necessarios INTEGER NOT NULL,
  tipo TEXT DEFAULT 'desconto' CHECK (tipo IN ('desconto', 'servico_gratis', 'brinde')),
  valor_desconto DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  estoque INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resgates realizados
CREATE TABLE IF NOT EXISTS resgates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  recompensa_id UUID NOT NULL REFERENCES recompensas(id),
  pontos_usados INTEGER NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'utilizado', 'cancelado')),
  codigo_resgate TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  utilizado_at TIMESTAMPTZ
);

-- Configuração do programa de fidelidade
CREATE TABLE IF NOT EXISTS fidelidade_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE UNIQUE,
  ativo BOOLEAN DEFAULT true,
  pontos_por_real DECIMAL(5,2) DEFAULT 1.0,
  bonus_aniversario INTEGER DEFAULT 100,
  bonus_indicacao INTEGER DEFAULT 50,
  nivel_prata_pontos INTEGER DEFAULT 500,
  nivel_ouro_pontos INTEGER DEFAULT 1500,
  nivel_diamante_pontos INTEGER DEFAULT 5000,
  mensagem_boas_vindas TEXT DEFAULT 'Bem-vindo ao nosso programa de fidelidade!',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE pontos_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE resgates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelidade_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_pontos_clientes" ON pontos_clientes FOR ALL USING (
  lava_jato_id IN (SELECT id FROM lava_jatos WHERE owner_id = auth.uid())
);
CREATE POLICY "owner_pontos_transacoes" ON pontos_transacoes FOR ALL USING (
  lava_jato_id IN (SELECT id FROM lava_jatos WHERE owner_id = auth.uid())
);
CREATE POLICY "owner_recompensas" ON recompensas FOR ALL USING (
  lava_jato_id IN (SELECT id FROM lava_jatos WHERE owner_id = auth.uid())
);
CREATE POLICY "owner_resgates" ON resgates FOR ALL USING (
  lava_jato_id IN (SELECT id FROM lava_jatos WHERE owner_id = auth.uid())
);
CREATE POLICY "owner_fidelidade_config" ON fidelidade_config FOR ALL USING (
  lava_jato_id IN (SELECT id FROM lava_jatos WHERE owner_id = auth.uid())
);
