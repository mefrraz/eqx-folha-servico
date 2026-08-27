-- ============================================================
-- v7.28: API keys para o MCP / API pública
-- Tabela para gerir chaves de acesso por cliente (Hermes, RH, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,  -- SHA-256 da chave (nunca guardar a chave em claro)
  role TEXT NOT NULL DEFAULT 'read' CHECK (role IN ('read', 'admin')),
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- RLS: só admins gerem as chaves
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage api keys" ON api_keys;
CREATE POLICY "Admins can manage api keys"
  ON api_keys FOR ALL
  USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
