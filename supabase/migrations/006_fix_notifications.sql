-- ============================================================
-- MIGRATION v6.10: Fix notification trigger + add INSERT policy
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Add INSERT policy for notifications (belt-and-suspenders with SECURITY DEFINER trigger)
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications"
ON notifications FOR INSERT
WITH CHECK (is_admin());

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
