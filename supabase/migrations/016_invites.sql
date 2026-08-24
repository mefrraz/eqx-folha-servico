-- ============================================================
-- v7.15: Convites de acesso
-- Tabela para o admin criar códigos de convite com prazo,
-- ver quem usou, e manter histórico para estatística.
-- ============================================================

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: admins gerem, workers leem (para validar o código no registo)
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage invites" ON invites;
CREATE POLICY "Admins can manage invites"
  ON invites FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Anyone can read invites" ON invites;
CREATE POLICY "Anyone can read invites"
  ON invites FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
