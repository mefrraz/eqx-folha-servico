-- ============================================================
-- v6.38: Dedup resumos semanais
-- Tabela para evitar emails duplicados por worker+semana
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('reminder', 'stats')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, week_start, email_type)
);

-- RLS: admins read, system inserts via service role
ALTER TABLE weekly_email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read email log" ON weekly_email_log;
CREATE POLICY "Admins can read email log" ON weekly_email_log FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Service role can insert email log" ON weekly_email_log;
CREATE POLICY "Service role can insert email log" ON weekly_email_log FOR INSERT TO service_role WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_weekly_email_log_worker ON weekly_email_log(worker_id, week_start);
