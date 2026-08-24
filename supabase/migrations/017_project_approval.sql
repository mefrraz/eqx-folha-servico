-- ============================================================
-- v7.17: Aprovação de obras pelo admin
-- Adiciona estado às atribuições worker↔project.
-- 'pending' = aguarda aprovação do admin; 'approved' = ativa.
-- ============================================================

ALTER TABLE worker_projects ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved'));

CREATE INDEX IF NOT EXISTS idx_worker_projects_status ON worker_projects(status);
