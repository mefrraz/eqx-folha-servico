-- ============================================================
-- EQX FOLHA DE SERVIÇO — SCHEMA COMPLETO + CORREÇÕES + SEED
-- Executar no Supabase SQL Editor (uma vez)
-- ⚠️ Apaga dados antigos de seed, preserva contas admin existentes
-- ============================================================

-- ────────────────────────────────────────────
-- FASE 0: LIMPAR SCHEMA ANTIGO
-- ────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_sheet_inserted ON work_sheets;
DROP TRIGGER IF EXISTS on_sheet_submitted ON work_sheets;
DROP TRIGGER IF EXISTS work_entries_updated_at ON work_entries;
DROP TRIGGER IF EXISTS work_sheets_updated_at ON work_sheets;
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
DROP TRIGGER IF EXISTS clients_updated_at ON clients;
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS notify_sheet_inserted CASCADE;
DROP FUNCTION IF EXISTS notify_sheet_submitted CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS work_entries CASCADE;
DROP TABLE IF EXISTS work_sheets CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ────────────────────────────────────────────
-- FASE 1: TABELAS
-- ────────────────────────────────────────────

-- 1.1 Perfis (extende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'admin', 'hr')),
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Folhas de serviço
CREATE TABLE work_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  client TEXT NOT NULL,
  work_number TEXT NOT NULL DEFAULT '',
  project_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, week_start)
);

-- 1.3 Entradas diárias
CREATE TABLE work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES work_sheets(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('monday','tuesday','wednesday','thursday','friday','saturday')),
  work_description TEXT DEFAULT '',
  work_type TEXT DEFAULT '' CHECK (work_type IN ('','new_installation','installation_continuation','preventive_maintenance','corrective_maintenance')),
  date DATE,
  evaluation TEXT DEFAULT '',
  signature TEXT DEFAULT '',
  signature_url TEXT,
  observations TEXT DEFAULT '',
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Obras
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link project_id FK (criado depois de projects existir)
ALTER TABLE work_sheets ADD CONSTRAINT fk_work_sheets_project 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- 1.6 Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'sheet_submitted',
  message TEXT NOT NULL,
  worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sheet_id UUID REFERENCES work_sheets(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- FASE 2: TRIGGERS E FUNÇÕES
-- ────────────────────────────────────────────

-- 2.1 updated_at automático
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER work_sheets_updated_at BEFORE UPDATE ON work_sheets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER work_entries_updated_at BEFORE UPDATE ON work_entries FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2.2 Criar perfil automaticamente ao registar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'worker')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────
-- FASE 3: ROW LEVEL SECURITY
-- ────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3.1 Helper is_admin()
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

-- 3.2 Profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (is_admin());

-- 3.3 Work sheets
CREATE POLICY "Workers can CRUD own sheets" ON work_sheets FOR ALL USING (worker_id = auth.uid());
CREATE POLICY "Workers can insert own sheets" ON work_sheets FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Admins can read all sheets" ON work_sheets FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update sheets" ON work_sheets FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- 3.4 Work entries
CREATE POLICY "Workers can CRUD entries of own sheets" ON work_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM work_sheets WHERE work_sheets.id = work_entries.sheet_id AND work_sheets.worker_id = auth.uid()));
CREATE POLICY "Workers can insert entries of own sheets" ON work_entries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM work_sheets WHERE work_sheets.id = work_entries.sheet_id AND work_sheets.worker_id = auth.uid()));
CREATE POLICY "Admins can read all entries" ON work_entries FOR SELECT USING (is_admin());

-- 3.5 Clients
CREATE POLICY "Admins can CRUD clients" ON clients FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Workers can read clients" ON clients FOR SELECT USING (true);

-- 3.6 Projects
CREATE POLICY "Admins can CRUD projects" ON projects FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Workers can read projects" ON projects FOR SELECT USING (true);

-- 3.7 Notifications
CREATE POLICY "Admins can read all notifications" ON notifications FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update notifications" ON notifications FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can insert notifications" ON notifications FOR INSERT WITH CHECK (is_admin());

-- ────────────────────────────────────────────
-- FASE 4: TRIGGERS DE NOTIFICAÇÃO
-- ────────────────────────────────────────────

-- 4.1 Notificar ao submeter rascunho existente (AFTER UPDATE)
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

CREATE TRIGGER on_sheet_submitted
  AFTER UPDATE ON work_sheets
  FOR EACH ROW EXECUTE FUNCTION notify_sheet_submitted();

-- 4.2 Notificar ao criar folha nova directamente como submetida (AFTER INSERT) — v6.10 fix
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

CREATE TRIGGER on_sheet_inserted
  AFTER INSERT ON work_sheets
  FOR EACH ROW EXECUTE FUNCTION notify_sheet_inserted();

-- ────────────────────────────────────────────
-- FASE 5: ÍNDICES
-- ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_work_sheets_worker ON work_sheets(worker_id, week_start);
CREATE INDEX IF NOT EXISTS idx_work_sheets_status ON work_sheets(status);
CREATE INDEX IF NOT EXISTS idx_work_entries_sheet ON work_entries(sheet_id);

-- ────────────────────────────────────────────
-- FASE 6: STORAGE POLICIES (bucket "rubricas")
-- ────────────────────────────────────────────

-- Upload: authenticated users, imagens só
DROP POLICY IF EXISTS "Users can upload own rubrica" ON storage.objects;
CREATE POLICY "Users can upload own rubrica"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rubricas'
  AND (LOWER(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'))
);

-- Read: público
DROP POLICY IF EXISTS "Anyone can read rubricas" ON storage.objects;
CREATE POLICY "Anyone can read rubricas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'rubricas');

-- Delete: owner ou admin
DROP POLICY IF EXISTS "Owner or admin can delete rubrica" ON storage.objects;
CREATE POLICY "Owner or admin can delete rubrica"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rubricas'
  AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr')))
);

-- Update: owner
DROP POLICY IF EXISTS "Owner can update own rubrica" ON storage.objects;
CREATE POLICY "Owner can update own rubrica"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'rubricas' AND owner = auth.uid())
WITH CHECK (bucket_id = 'rubricas' AND owner = auth.uid());

-- ────────────────────────────────────────────
-- FASE 7: REPOR PERFIS DOS ADMINS EXISTENTES
-- ────────────────────────────────────────────

-- Recriar profiles para admins que já existiam antes do DROP
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'admin', created_at, NOW()
FROM auth.users
WHERE raw_user_meta_data->>'full_name' IS NOT NULL
  AND id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- ────────────────────────────────────────────
-- FASE 8: SEED — 3 clientes, 5 obras, 54 trabalhadores, ~4 meses de folhas
-- ⚠️ Apaga dados de seed antigos, preserva contas admin
-- ────────────────────────────────────────────

-- 8.1 Limpar dados de seed antigos
DELETE FROM work_entries;
DELETE FROM work_sheets;
DELETE FROM projects;
DELETE FROM clients;
DELETE FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@eqx.pt' AND raw_user_meta_data->>'full_name' IS NOT NULL);
DELETE FROM auth.users WHERE email LIKE '%@eqx.pt';

-- 8.2 Criar 3 clientes
INSERT INTO clients (id, name) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'EDP Renováveis'),
  ('c1000000-0000-0000-0000-000000000002', 'Navais de Viana'),
  ('c1000000-0000-0000-0000-000000000003', 'Metro do Porto');

-- 8.3 Criar 5 obras
INSERT INTO projects (id, name, client_id, location) VALUES
  ('d2000000-0000-0000-0000-000000000001', 'Parque Eólico Serra Alta',    'c1000000-0000-0000-0000-000000000001', 'Guarda, Portugal'),
  ('d2000000-0000-0000-0000-000000000002', 'Subestação de Valdigem',      'c1000000-0000-0000-0000-000000000001', 'Lamego, Portugal'),
  ('d2000000-0000-0000-0000-000000000003', 'Estaleiro Navais Viana F3',   'c1000000-0000-0000-0000-000000000002', 'Viana do Castelo, Portugal'),
  ('d2000000-0000-0000-0000-000000000004', 'Manutenção Elétrica Navais',   'c1000000-0000-0000-0000-000000000002', 'Viana do Castelo, Portugal'),
  ('d2000000-0000-0000-0000-000000000005', 'Linha Amarela Extensão F2',    'c1000000-0000-0000-0000-000000000003', 'Porto, Portugal');

-- 8.4 Criar 54 trabalhadores + folhas (gera notificações via triggers)
DO $$
DECLARE
  names TEXT[] := ARRAY[
    'João Silva','Maria Santos','Pedro Oliveira','Ana Costa','Rui Ferreira','Carla Martins',
    'Miguel Lopes','Sofia Almeida','Tiago Pereira','Inês Carvalho','Bruno Marques','Rita Sousa',
    'André Gonçalves','Laura Fernandes','Diogo Teixeira','Marta Ribeiro','Hugo Cardoso','Cátia Neves',
    'Nuno Correia','Sara Pinto','Luís Monteiro','Teresa Coelho','Ricardo Vieira','Patrícia Cunha',
    'Jorge Batista','Sandra Morais','Filipe Araújo','Cristina Leite','Paulo Macedo','Susana Santos',
    'Rafael Barbosa','Liliana Guerreiro','Daniel Castro','Carla Figueiredo','Sérgio Branco','Vânia Anjos',
    'Marco Simões','Isabel Nunes','Eduardo Lourenço','Vera Henriques','Artur Mendes','Lúcia Fonseca',
    'Gonçalo Matos','Cláudia Melo','Francisco Pires','Helena Cruz','António Amorim','Leonor Tavares',
    'Carlos Reis','Patrícia Machado','Luís Campos','Rosa Miranda','José Magalhães','Natália Gomes'
  ];
  projects UUID[] := ARRAY[
    'd2000000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000002','d2000000-0000-0000-0000-000000000002',
    'd2000000-0000-0000-0000-000000000002','d2000000-0000-0000-0000-000000000002',
    'd2000000-0000-0000-0000-000000000002','d2000000-0000-0000-0000-000000000002',
    'd2000000-0000-0000-0000-000000000002','d2000000-0000-0000-0000-000000000002',
    'd2000000-0000-0000-0000-000000000002','d2000000-0000-0000-0000-000000000002',
    'd2000000-0000-0000-0000-000000000002','d2000000-0000-0000-0000-000000000002',
    'd2000000-0000-0000-0000-000000000003','d2000000-0000-0000-0000-000000000003',
    'd2000000-0000-0000-0000-000000000003','d2000000-0000-0000-0000-000000000003',
    'd2000000-0000-0000-0000-000000000003','d2000000-0000-0000-0000-000000000003',
    'd2000000-0000-0000-0000-000000000003','d2000000-0000-0000-0000-000000000003',
    'd2000000-0000-0000-0000-000000000003','d2000000-0000-0000-0000-000000000003',
    'd2000000-0000-0000-0000-000000000003','d2000000-0000-0000-0000-000000000003',
    'd2000000-0000-0000-0000-000000000003','d2000000-0000-0000-0000-000000000003',
    'd2000000-0000-0000-0000-000000000004','d2000000-0000-0000-0000-000000000004',
    'd2000000-0000-0000-0000-000000000004','d2000000-0000-0000-0000-000000000004',
    'd2000000-0000-0000-0000-000000000004','d2000000-0000-0000-0000-000000000004',
    'd2000000-0000-0000-0000-000000000004','d2000000-0000-0000-0000-000000000004',
    'd2000000-0000-0000-0000-000000000004','d2000000-0000-0000-0000-000000000004',
    'd2000000-0000-0000-0000-000000000004','d2000000-0000-0000-0000-000000000004',
    'd2000000-0000-0000-0000-000000000004','d2000000-0000-0000-0000-000000000004',
    'd2000000-0000-0000-0000-000000000005','d2000000-0000-0000-0000-000000000005',
    'd2000000-0000-0000-0000-000000000005','d2000000-0000-0000-0000-000000000005',
    'd2000000-0000-0000-0000-000000000005','d2000000-0000-0000-0000-000000000005',
    'd2000000-0000-0000-0000-000000000005','d2000000-0000-0000-0000-000000000005',
    'd2000000-0000-0000-0000-000000000005','d2000000-0000-0000-0000-000000000005',
    'd2000000-0000-0000-0000-000000000005','d2000000-0000-0000-0000-000000000005',
    'd2000000-0000-0000-0000-000000000005','d2000000-0000-0000-0000-000000000005'
  ];
  uid UUID;
  sid UUID;
  w INT;
  d INT;
  w_start DATE;
  descr TEXT;
  st TIME;
  et TIME;
BEGIN
  FOR i IN 1..54 LOOP
    uid := gen_random_uuid();
    
    -- Criar auth user
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role, confirmation_token, recovery_token, created_at, updated_at, is_super_admin)
    VALUES (uid, '00000000-0000-0000-0000-000000000000', lower(regexp_replace(names[i], ' ', '.', 'g')) || '@eqx.pt', crypt('eqx2024!', gen_salt('bf')), now(), jsonb_build_object('full_name', names[i]), 'authenticated', 'authenticated', '', '', now(), now(), false);

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', lower(regexp_replace(names[i], ' ', '.', 'g')) || '@eqx.pt'), 'email', lower(regexp_replace(names[i], ' ', '.', 'g')) || '@eqx.pt', now(), now());
    
    -- Trigger handle_new_user cria profile automaticamente
    
    -- Criar 17 semanas de folhas (~4 meses)
    FOR w IN 0..16 LOOP
      w_start := date_trunc('week', CURRENT_DATE)::date - (w * 7);
      IF extract(dow from w_start) > 1 THEN
        w_start := w_start - (extract(dow from w_start)::int - 1);
      END IF;
      
      -- 80% chance de ter folha nessa semana
      IF random() < 0.8 THEN
        INSERT INTO work_sheets (worker_id, week_start, week_end, client, work_number, project_id, status)
        VALUES (
          uid,
          w_start,
          w_start + 5,
          (ARRAY['EDP Renováveis','Navais de Viana','Metro do Porto'])[1 + floor(random() * 3)::int],
          'OB-' || to_char(w_start, 'YY') || '-' || lpad((floor(random() * 999) + 1)::text, 3, '0'),
          projects[i],
          CASE 
            WHEN w = 0 THEN 'draft'
            WHEN w <= 2 THEN 'submitted'
            ELSE 'reviewed'
          END
        )
        RETURNING id INTO sid;
        
        -- 6 entradas diárias
        FOR d IN 0..5 LOOP
          -- 30% dos sábados sem trabalho
          IF d = 5 AND random() < 0.3 THEN
            INSERT INTO work_entries (sheet_id, day, date) VALUES (sid, 'saturday', w_start + d);
            CONTINUE;
          END IF;
          
          st := ((7 + floor(random() * 1.5)::int)::text || ':' || lpad((floor(random() * 4) * 15)::text, 2, '0') || ':00')::time;
          et := ((16 + floor(random() * 2.5)::int)::text || ':' || lpad((floor(random() * 4) * 15)::text, 2, '0') || ':00')::time;
          descr := (ARRAY[
            'Instalação de quadro elétrico','Ligação de tomadas industriais','Manutenção preventiva de motores',
            'Reparação de painel de controlo','Soldadura de estruturas metálicas','Montagem de calhas',
            'Teste de continuidade elétrica','Passagem de cabos BT','Inspeção de válvulas',
            'Substituição de disjuntores','Limpeza de permutadores','Instalação de iluminação LED',
            'Certificação de instalação','Configuração de inversores','Reparação de tubagens',
            'Montagem de andaimes','Ligação ao quadro geral','Verificação de terras'
          ])[1 + floor(random() * 18)::int];
          
          INSERT INTO work_entries (sheet_id, day, work_description, work_type, date, evaluation, signature, observations, start_time, end_time)
          VALUES (
            sid,
            CASE d WHEN 0 THEN 'monday' WHEN 1 THEN 'tuesday' WHEN 2 THEN 'wednesday' WHEN 3 THEN 'thursday' WHEN 4 THEN 'friday' ELSE 'saturday' END,
            descr,
            (ARRAY['new_installation','installation_continuation','preventive_maintenance','corrective_maintenance'])[1 + floor(random() * 4)::int],
            w_start + d,
            (ARRAY['Bom','Muito Bom','Satisfatório',''])[1 + floor(random() * 4)::int],
            left(names[i],1) || left(split_part(names[i],' ',2),1),
            CASE WHEN random() < 0.2 THEN (ARRAY['Aguardar material','Verificar com encarregado','Horas extra aprovadas'])[1 + floor(random() * 3)::int] ELSE '' END,
            st, et
          );
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ 3 clientes, 5 obras, 54 trabalhadores, ~700 folhas, ~4000 entradas';
  RAISE NOTICE '📧 Logins: nome.sobrenome@eqx.pt / eqx2024! (ex: joao.silva@eqx.pt)';
END;
$$;

-- ────────────────────────────────────────────
-- FIM
-- ────────────────────────────────────────────
