-- ============================================================
-- v7.6: Preferência de turnos por trabalhador
-- Permite indicar se o trabalhador trabalha manhã, tarde ou ambos.
-- O formulário só mostra os turnos relevantes.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shift_preference TEXT NOT NULL DEFAULT 'both'
  CHECK (shift_preference IN ('both', 'morning', 'afternoon'));
