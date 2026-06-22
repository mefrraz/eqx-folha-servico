-- ============================================================
-- MIGRATION v6.10: Fix notification trigger + add INSERT policy
-- Executar no Supabase SQL Editor
-- NOTA: Corre primeiro a 005_notifications.sql se a tabela não existir
-- ============================================================

-- Garantir que a tabela existe (idempotente com a 005)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'sheet_submitted',
  message TEXT NOT NULL,
  worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sheet_id UUID REFERENCES work_sheets(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. Add INSERT policy for notifications
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications"
ON notifications FOR INSERT
WITH CHECK (is_admin());

-- Garantir que policies de leitura/update existem (caso a 005 não tenha corrido)
DROP POLICY IF EXISTS "Admins can read all notifications" ON notifications;
CREATE POLICY "Admins can read all notifications"
ON notifications FOR SELECT
USING (is_admin());

DROP POLICY IF EXISTS "Admins can update notifications" ON notifications;
CREATE POLICY "Admins can update notifications"
ON notifications FOR UPDATE
USING (is_admin());

-- 2. Add AFTER INSERT trigger so new sheets submitted directly also generate notifications
CREATE OR REPLACE FUNCTION notify_sheet_inserted()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  worker_name TEXT;
BEGIN
  IF NEW.status = 'submitted' THEN
    SELECT full_name INTO worker_name FROM profiles WHERE id = NEW.worker_id;
    INSERT INTO notifications (type, message, worker_id, sheet_id)
    VALUES ('sheet_submitted', worker_name || ' submeteu a folha da semana ' || NEW.week_start, NEW.worker_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sheet_inserted ON work_sheets;
CREATE TRIGGER on_sheet_inserted
  AFTER INSERT ON work_sheets
  FOR EACH ROW EXECUTE FUNCTION notify_sheet_inserted();
