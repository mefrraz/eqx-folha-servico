-- ============================================================
-- NOTIFICATIONS: v5.1
-- Executar no Supabase SQL Editor
-- ============================================================

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

CREATE POLICY "Admins can read all notifications"
ON notifications FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update notifications"
ON notifications FOR UPDATE
USING (is_admin());

-- Trigger: notify on sheet submission
CREATE OR REPLACE FUNCTION notify_sheet_submitted()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  worker_name TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'submitted' THEN
    SELECT full_name INTO worker_name FROM profiles WHERE id = NEW.worker_id;
    INSERT INTO notifications (type, message, worker_id, sheet_id)
    VALUES ('sheet_submitted', worker_name || ' submeteu a folha da semana ' || NEW.week_start, NEW.worker_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sheet_submitted ON work_sheets;
CREATE TRIGGER on_sheet_submitted
  AFTER UPDATE ON work_sheets
  FOR EACH ROW EXECUTE FUNCTION notify_sheet_submitted();
