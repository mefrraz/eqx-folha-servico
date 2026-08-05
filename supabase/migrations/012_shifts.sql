-- ============================================================
-- v6.36: Turnos Manhã/Tarde
-- Adiciona coluna shift a work_entries para suportar 2 turnos/dia
-- ============================================================

-- Adicionar coluna shift (morning | afternoon)
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS shift TEXT NOT NULL DEFAULT 'morning' CHECK (shift IN ('morning', 'afternoon'));

-- Índice para queries por dia+turno
CREATE INDEX IF NOT EXISTS idx_work_entries_day_shift ON work_entries(sheet_id, day, shift);
