-- ============================================================
-- LAVAI — NPS (Net Promoter Score) Schema
-- Run after schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS nps_avaliacoes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lava_jato_id  uuid        NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  atendimento_id uuid       REFERENCES atendimentos(id) ON DELETE SET NULL,
  cliente_nome  text,
  telefone      text,
  nota          int         NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE nps_avaliacoes ENABLE ROW LEVEL SECURITY;

-- Owner can read their NPS data
CREATE POLICY "nps_select_owner" ON nps_avaliacoes
  FOR SELECT USING (
    lava_jato_id IN (
      SELECT id FROM lava_jatos WHERE user_id = auth.uid()
    )
  );

-- Public insert (anonymous) — anyone can submit a rating
CREATE POLICY "nps_insert_public" ON nps_avaliacoes
  FOR INSERT WITH CHECK (true);

-- Public update (to allow re-rating same atendimento)
CREATE POLICY "nps_update_public" ON nps_avaliacoes
  FOR UPDATE USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nps_lava_jato    ON nps_avaliacoes(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_nps_atendimento  ON nps_avaliacoes(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_nps_nota         ON nps_avaliacoes(nota);
CREATE INDEX IF NOT EXISTS idx_nps_created_at   ON nps_avaliacoes(created_at DESC);
