-- ============================================================
-- MIGRATION: signature_url on work_entries
-- Executar no Supabase SQL Editor
-- ============================================================

ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Para criar o bucket de storage manualmente:
-- 1. Supabase Dashboard → Storage → New Bucket
-- 2. Nome: "rubricas"
-- 3. Public bucket: SIM (para leitura de imagens)
-- 4. Policies: dar INSERT a authenticated users, SELECT a everyone
