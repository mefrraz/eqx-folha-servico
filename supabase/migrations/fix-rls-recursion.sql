-- ============================================================
-- FIX: RLS recursion — is_admin() with SECURITY DEFINER
-- Executar AGORA no Supabase SQL Editor
-- ============================================================

-- 1. Create is_admin() helper — bypasses RLS, no recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role IN ('admin', 'hr');
END;
$$ LANGUAGE plpgsql;

-- 2. Recreate all admin policies using is_admin()
-- profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- work_sheets
DROP POLICY IF EXISTS "Admins can read all sheets" ON work_sheets;
CREATE POLICY "Admins can read all sheets"
  ON work_sheets FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update sheets" ON work_sheets;
CREATE POLICY "Admins can update sheets"
  ON work_sheets FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- work_entries
DROP POLICY IF EXISTS "Admins can read all entries" ON work_entries;
CREATE POLICY "Admins can read all entries"
  ON work_entries FOR SELECT
  USING (is_admin());
