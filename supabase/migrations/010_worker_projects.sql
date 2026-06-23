-- ============================================================
-- WORKER_PROJECTS — atribuição trabalhador ↔ obra
-- ============================================================

CREATE TABLE IF NOT EXISTS worker_projects (
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (worker_id, project_id)
);

ALTER TABLE worker_projects ENABLE ROW LEVEL SECURITY;

-- Workers can read their own assignments
DROP POLICY IF EXISTS "Workers can read own project assignments" ON worker_projects;
CREATE POLICY "Workers can read own project assignments"
ON worker_projects FOR SELECT
USING (worker_id = auth.uid());

-- Workers can insert their own assignments
DROP POLICY IF EXISTS "Workers can insert own project assignments" ON worker_projects;
CREATE POLICY "Workers can insert own project assignments"
ON worker_projects FOR INSERT
WITH CHECK (worker_id = auth.uid());

-- Admins can CRUD
DROP POLICY IF EXISTS "Admins can CRUD worker project assignments" ON worker_projects;
CREATE POLICY "Admins can CRUD worker project assignments"
ON worker_projects FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
