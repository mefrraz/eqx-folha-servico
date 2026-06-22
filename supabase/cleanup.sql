-- ============================================================
-- LIMPAR TUDO — reverter complete-schema-seed.sql
-- Colar no SQL Editor do projeto ERRADO → Run
-- ============================================================

-- Triggers
DROP TRIGGER IF EXISTS on_sheet_inserted ON work_sheets;
DROP TRIGGER IF EXISTS on_sheet_submitted ON work_sheets;
DROP TRIGGER IF EXISTS work_entries_updated_at ON work_entries;
DROP TRIGGER IF EXISTS work_sheets_updated_at ON work_sheets;
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
DROP TRIGGER IF EXISTS clients_updated_at ON clients;
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Functions
DROP FUNCTION IF EXISTS notify_sheet_inserted CASCADE;
DROP FUNCTION IF EXISTS notify_sheet_submitted CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Policies (storage)
DROP POLICY IF EXISTS "Users can upload own rubrica" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read rubricas" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin can delete rubrica" ON storage.objects;
DROP POLICY IF EXISTS "Owner can update own rubrica" ON storage.objects;

-- Tables (ordem inversa por causa das FKs)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS work_entries CASCADE;
DROP TABLE IF EXISTS work_sheets CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Seed users (só @eqx.pt, não apaga admins)
DELETE FROM auth.users WHERE email LIKE '%@eqx.pt';
