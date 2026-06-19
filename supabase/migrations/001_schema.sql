-- ============================================================
-- Folha de Serviço — Schema Inicial
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard > SQL Editor
-- ============================================================

-- 1. Tabela de perfis (extende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'admin', 'hr')),
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2. Folhas de serviço (uma por semana por trabalhador)
CREATE TABLE IF NOT EXISTS work_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,  -- segunda-feira da semana
  week_end DATE NOT NULL,    -- sábado
  client TEXT NOT NULL,
  work_number TEXT NOT NULL DEFAULT '',  -- Nº Obra
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, week_start)
);

CREATE TRIGGER work_sheets_updated_at
  BEFORE UPDATE ON work_sheets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 3. Entradas diárias (cada dia da semana)
CREATE TABLE IF NOT EXISTS work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES work_sheets(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  )),
  work_description TEXT DEFAULT '',
  work_type TEXT DEFAULT '' CHECK (work_type IN (
    '', 'new_installation', 'installation_continuation',
    'preventive_maintenance', 'corrective_maintenance'
  )),
  date DATE,
  evaluation TEXT DEFAULT '',
  signature TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER work_entries_updated_at
  BEFORE UPDATE ON work_entries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4. RLS — Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

-- Políticas: profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas: work_sheets
CREATE POLICY "Workers can CRUD own sheets"
  ON work_sheets FOR ALL
  USING (worker_id = auth.uid());

CREATE POLICY "Admins can read all sheets"
  ON work_sheets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins can update sheets"
  ON work_sheets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  )
  WITH CHECK (
    -- Admins só podem alterar estado, não dados do trabalhador
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Políticas: work_entries
CREATE POLICY "Workers can CRUD entries of own sheets"
  ON work_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM work_sheets
      WHERE work_sheets.id = work_entries.sheet_id
      AND work_sheets.worker_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all entries"
  ON work_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- 5. Trigger: criar perfil automaticamente ao criar user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'worker'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Índices para performance
CREATE INDEX idx_work_sheets_worker ON work_sheets(worker_id, week_start);
CREATE INDEX idx_work_sheets_status ON work_sheets(status);
CREATE INDEX idx_work_entries_sheet ON work_entries(sheet_id);
