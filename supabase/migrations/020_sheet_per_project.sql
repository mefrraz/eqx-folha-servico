-- ============================================================
-- v10.0: Folha por obra + obras no convite
-- - Uma folha por trabalhador POR SEMANA POR OBRA
-- - Convites podem indicar as obras do trabalhador (fim do seletor)
-- ============================================================

-- Folhas: unique passa a incluir a obra
ALTER TABLE work_sheets DROP CONSTRAINT IF EXISTS work_sheets_worker_id_week_start_key;
ALTER TABLE work_sheets DROP CONSTRAINT IF EXISTS work_sheets_worker_week_project_unique;
ALTER TABLE work_sheets ADD CONSTRAINT work_sheets_worker_week_project_unique
  UNIQUE (worker_id, week_start, project_id);

-- Convites: obras atribuídas pelo admin (o trabalhador nunca vê todas as obras)
ALTER TABLE invites ADD COLUMN IF NOT EXISTS project_ids UUID[] NOT NULL DEFAULT '{}';