-- ============================================================
-- v6.37: Convite por email
-- Tabela de tokens de convite para onboarding de utilizadores
-- ============================================================

CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para lookup rápido por token
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);

-- RLS: só admins podem criar/ver tokens
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can CRUD invite tokens" ON invite_tokens;
CREATE POLICY "Admins can CRUD invite tokens" ON invite_tokens FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Anyone can read own invite token" ON invite_tokens;
CREATE POLICY "Anyone can read own invite token" ON invite_tokens FOR SELECT USING (true);
