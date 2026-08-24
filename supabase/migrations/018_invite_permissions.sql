-- ============================================================
-- v7.19: Permissões nos convites
-- role: 'worker' | 'admin' — papel da conta criada
-- requires_approval: se a seleção inicial de obras requer aprovação
-- ============================================================

ALTER TABLE invites ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'worker'
  CHECK (role IN ('worker', 'admin'));
ALTER TABLE invites ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;

-- Guarda no perfil se o trabalhador precisa de aprovação nas obras
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;
