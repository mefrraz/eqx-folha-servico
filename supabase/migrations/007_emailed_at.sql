-- ============================================================
-- MIGRATION: emailed_at column for notification email tracking
-- Executar no Supabase SQL Editor
-- ============================================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;
