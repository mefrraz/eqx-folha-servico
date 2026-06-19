-- ============================================================
-- SUPER SEED v4.3: 3 clientes, 5 obras, 50+ trabalhadores, 4 meses
-- ⚠️ APAGA dados antigos (menos user admin)
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Apagar dados antigos
DELETE FROM work_entries;
DELETE FROM work_sheets;
DELETE FROM projects;
DELETE FROM clients;
-- Manter profiles e auth.users (menos admin)

-- 2. Criar 3 clientes
INSERT INTO clients (id, name) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'EDP Renováveis'),
  ('c1000000-0000-0000-0000-000000000002', 'Navais de Viana'),
  ('c1000000-0000-0000-0000-000000000003', 'Metro do Porto');

-- 3. Criar 5 obras ligadas a clientes
INSERT INTO projects (id, name, client_id, location) VALUES
  ('d2000000-0000-0000-0000-000000000001', 'Parque Eólico Serra Alta',    'c1000000-0000-0000-0000-000000000001', 'Guarda, Portugal'),
  ('d2000000-0000-0000-0000-000000000002', 'Subestação de Valdigem',      'c1000000-0000-0000-0000-000000000001', 'Lamego, Portugal'),
  ('d2000000-0000-0000-0000-000000000003', 'Estaleiro Navais Viana F3',   'c1000000-0000-0000-0000-000000000002', 'Viana do Castelo, Portugal'),
  ('d2000000-0000-0000-0000-000000000004', 'Manutenção Elétrica Navais',   'c1000000-0000-0000-0000-000000000002', 'Viana do Castelo, Portugal'),
  ('d2000000-0000-0000-0000-000000000005', 'Linha Amarela Extensão F2',    'c1000000-0000-0000-0000-000000000003', 'Porto, Portugal');

-- 4. Criar 54 trabalhadores + auth users
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
    
    -- Trigger cria profile automaticamente
    
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
  
  RAISE NOTICE '✅ Seed v4.3: 3 clientes, 5 obras, 54 trabalhadores, ~700 folhas, ~4000 entradas';
  RAISE NOTICE '🔑 Login: nome.sobrenome@eqx.pt / eqx2024! (ex: joao.silva@eqx.pt)';
END;
$$;
