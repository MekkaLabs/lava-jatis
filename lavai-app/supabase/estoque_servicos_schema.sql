-- ============================================================
-- LAVAI — ESTOQUE + SERVIÇOS (Schema incremental, idempotente)
-- ============================================================
-- Rodar UMA VEZ no Supabase SQL Editor, DEPOIS do SETUP_COMPLETO.sql.
--
-- Adiciona:
--   • Módulo de estoque: categorias, itens, movimentações
--   • Função atômica de movimentação (saldo NUNCA negativo)
--   • Extensão da tabela `servicos` (descricao, categoria, updated_at)
--   • Consumo de estoque por serviço (servico_insumos)
--
-- Padrão canônico: multi-tenant por `lava_jato_id`, RLS `<tabela>_owner`.
-- ============================================================


-- ============================================================
-- SECTION 1: ESTOQUE — CATEGORIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS estoque_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estoque_categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estoque_categorias_owner" ON estoque_categorias;
CREATE POLICY "estoque_categorias_owner" ON estoque_categorias
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_estoque_categorias_lava_jato ON estoque_categorias(lava_jato_id);


-- ============================================================
-- SECTION 2: ESTOQUE — ITENS
-- ============================================================
CREATE TABLE IF NOT EXISTS estoque_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES estoque_categorias(id) ON DELETE SET NULL,
  nome text NOT NULL,
  sku text,
  unidade text NOT NULL DEFAULT 'un' CHECK (unidade IN ('un','kg','g','L','ml','cx','par')),
  qtd_atual numeric(12,3) NOT NULL DEFAULT 0 CHECK (qtd_atual >= 0),
  estoque_minimo numeric(12,3) NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  custo decimal(10,2) DEFAULT 0 CHECK (custo >= 0),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SKU único por lava-jato (quando informado)
CREATE UNIQUE INDEX IF NOT EXISTS idx_estoque_itens_sku_unico
  ON estoque_itens(lava_jato_id, sku) WHERE sku IS NOT NULL AND sku <> '';

ALTER TABLE estoque_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estoque_itens_owner" ON estoque_itens;
CREATE POLICY "estoque_itens_owner" ON estoque_itens
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_estoque_itens_lava_jato ON estoque_itens(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_estoque_itens_categoria ON estoque_itens(categoria_id);


-- ============================================================
-- SECTION 3: ESTOQUE — MOVIMENTAÇÕES
-- ============================================================
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  item_id uuid REFERENCES estoque_itens(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida')),
  quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  motivo text,
  responsavel text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estoque_movimentacoes_owner" ON estoque_movimentacoes;
CREATE POLICY "estoque_movimentacoes_owner" ON estoque_movimentacoes
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_estoque_mov_lava_jato ON estoque_movimentacoes(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_item ON estoque_movimentacoes(item_id, created_at DESC);


-- ============================================================
-- SECTION 4: SERVIÇOS — extensão da tabela existente
-- (a tabela `servicos` já existe no SETUP_COMPLETO.sql)
-- ============================================================
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at ON servicos;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON estoque_itens;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON estoque_itens
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- SECTION 5: CONSUMO DE ESTOQUE POR SERVIÇO
-- ============================================================
CREATE TABLE IF NOT EXISTS servico_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id uuid REFERENCES lava_jatos(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES servicos(id) ON DELETE CASCADE,
  item_id uuid REFERENCES estoque_itens(id) ON DELETE CASCADE,
  quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE (servico_id, item_id)
);

ALTER TABLE servico_insumos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "servico_insumos_owner" ON servico_insumos;
CREATE POLICY "servico_insumos_owner" ON servico_insumos
  FOR ALL USING (lava_jato_id IN (SELECT id FROM lava_jatos WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_servico_insumos_servico ON servico_insumos(servico_id);
CREATE INDEX IF NOT EXISTS idx_servico_insumos_item ON servico_insumos(item_id);


-- ============================================================
-- SECTION 6: FUNÇÃO ATÔMICA DE MOVIMENTAÇÃO
-- Garante que o saldo NUNCA fica negativo. Atualiza o saldo do
-- item e registra a movimentação numa única transação. Usa
-- FOR UPDATE para evitar condição de corrida em saídas concorrentes.
-- SECURITY INVOKER (default) → RLS do chamador continua valendo.
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_movimentacao_estoque(
  p_lava_jato_id uuid,
  p_item_id      uuid,
  p_tipo         text,
  p_quantidade   numeric,
  p_motivo       text DEFAULT NULL,
  p_responsavel  text DEFAULT NULL
) RETURNS estoque_movimentacoes AS $$
DECLARE
  v_saldo_atual numeric;
  v_novo_saldo  numeric;
  v_mov         estoque_movimentacoes;
BEGIN
  IF p_tipo NOT IN ('entrada','saida') THEN
    RAISE EXCEPTION 'tipo inválido: %', p_tipo USING ERRCODE = '22023';
  END IF;

  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RAISE EXCEPTION 'quantidade deve ser positiva' USING ERRCODE = '22023';
  END IF;

  -- Bloqueia a linha do item para serializar movimentações concorrentes
  SELECT qtd_atual INTO v_saldo_atual
  FROM estoque_itens
  WHERE id = p_item_id AND lava_jato_id = p_lava_jato_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'item de estoque não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF p_tipo = 'entrada' THEN
    v_novo_saldo := v_saldo_atual + p_quantidade;
  ELSE
    v_novo_saldo := v_saldo_atual - p_quantidade;
  END IF;

  -- Regra de ouro: saldo nunca negativo
  IF v_novo_saldo < 0 THEN
    RAISE EXCEPTION 'saldo insuficiente: atual % , saída % deixaria o saldo negativo',
      v_saldo_atual, p_quantidade USING ERRCODE = '23514';
  END IF;

  UPDATE estoque_itens SET qtd_atual = v_novo_saldo WHERE id = p_item_id;

  INSERT INTO estoque_movimentacoes (lava_jato_id, item_id, tipo, quantidade, motivo, responsavel)
  VALUES (p_lava_jato_id, p_item_id, p_tipo, p_quantidade, p_motivo, p_responsavel)
  RETURNING * INTO v_mov;

  RETURN v_mov;
END;
$$ LANGUAGE plpgsql;
