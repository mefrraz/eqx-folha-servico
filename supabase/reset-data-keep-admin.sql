-- ============================================================
-- RESET: apagar TODOS os dados, manter o admin, atualizar schema
-- Executar no Supabase SQL Editor do projeto EQX
-- (https://hxlbpuzzxkssbotcazsh.supabase.co)
-- ============================================================

-- ── 1. Apagar todos os dados (mantém o admin em profiles) ──
DELETE FROM notifications;
DELETE FROM work_entries;
DELETE FROM work_sheets;
DELETE FROM worker_projects;
DELETE FROM invites;
DELETE FROM weekly_email_log;
DELETE FROM projects;
DELETE FROM clients;

-- ── 2. Atualizar schema (migrações 014–018) ──

-- 014: weekly_email_log (tabela de log de emails)
CREATE TABLE IF NOT EXISTS weekly_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('reminder', 'stats', 'reminder_friday')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, week_start, email_type)
);
ALTER TABLE weekly_email_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read email log" ON weekly_email_log;
CREATE POLICY "Admins can read email log" ON weekly_email_log FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Service role can insert email log" ON weekly_email_log;
CREATE POLICY "Service role can insert email log" ON weekly_email_log FOR INSERT TO service_role WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_weekly_email_log_worker ON weekly_email_log(worker_id, week_start);

-- 015: reminder_friday (já incluído no CHECK acima)

-- 016: invites (tabela de convites)
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'admin')),
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage invites" ON invites;
CREATE POLICY "Admins can manage invites" ON invites FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Anyone can read invites" ON invites;
CREATE POLICY "Anyone can read invites" ON invites FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);

-- 017: project_approval (estado das atribuições de obras)
ALTER TABLE worker_projects ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved'));
CREATE INDEX IF NOT EXISTS idx_worker_projects_status ON worker_projects(status);

-- 018: invite_permissions (requires_approval no perfil)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;

-- ── 3. Confirmar que os admins continuam com role 'admin' ──
-- (os DELETE acima não tocam em profiles, por isso o admin é preservado)
UPDATE profiles SET role = 'admin' WHERE role IN ('admin', 'hr');

-- ── 4. Confirmar os admins existentes ──
SELECT id, full_name, email, role FROM profiles WHERE role = 'admin';
