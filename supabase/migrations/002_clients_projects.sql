-- ============================================================
-- MIGRATION v4.2: Clients + Projects tables
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 3. Add project_id to work_sheets
ALTER TABLE work_sheets ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 4. RLS for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can CRUD clients" ON clients FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Workers can read clients" ON clients FOR SELECT USING (true);

-- 5. RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can CRUD projects" ON projects FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Workers can read projects" ON projects FOR SELECT USING (true);
