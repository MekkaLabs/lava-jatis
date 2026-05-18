-- WhatsApp Bot Schema for LAVAI
-- Run this in Supabase SQL editor after the main schema.sql

CREATE TABLE IF NOT EXISTS whatsapp_conversas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  estado TEXT DEFAULT 'inicio',
  contexto JSONB DEFAULT '{}',
  ultima_mensagem_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lava_jato_id, telefone)
);

CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  direcao TEXT NOT NULL CHECK (direcao IN ('entrada', 'saida')),
  mensagem TEXT NOT NULL,
  estado_conversa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lava_jato_id UUID NOT NULL REFERENCES lava_jatos(id) ON DELETE CASCADE UNIQUE,
  zapi_instance_id TEXT,
  zapi_token TEXT,
  zapi_client_token TEXT,
  numero_whatsapp TEXT,
  ativo BOOLEAN DEFAULT false,
  horario_inicio TIME DEFAULT '08:00',
  horario_fim TIME DEFAULT '18:00',
  mensagem_fora_horario TEXT DEFAULT 'Olá! Estamos fora do horário de atendimento. Funcionamos das 8h às 18h.',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_lava_jato ON whatsapp_conversas(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_telefone ON whatsapp_conversas(telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_lava_jato ON whatsapp_mensagens(lava_jato_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_telefone ON whatsapp_mensagens(telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_created ON whatsapp_mensagens(created_at DESC);

-- RLS
ALTER TABLE whatsapp_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Policies: owner can do everything on their data
CREATE POLICY "owner_whatsapp" ON whatsapp_conversas FOR ALL USING (
  lava_jato_id IN (SELECT id FROM lava_jatos WHERE owner_id = auth.uid())
);

CREATE POLICY "owner_mensagens" ON whatsapp_mensagens FOR ALL USING (
  lava_jato_id IN (SELECT id FROM lava_jatos WHERE owner_id = auth.uid())
);

CREATE POLICY "owner_config" ON whatsapp_config FOR ALL USING (
  lava_jato_id IN (SELECT id FROM lava_jatos WHERE owner_id = auth.uid())
);

-- Service role bypass (for webhook handler which uses service role key)
-- The webhook API route uses SUPABASE_SERVICE_ROLE_KEY, so RLS is bypassed automatically.
