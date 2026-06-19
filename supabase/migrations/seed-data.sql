-- ============================================================
-- AUTO-SEED: 6 trabalhadores + 3 semanas de dados falsos
-- Executar no Supabase SQL Editor — corre TUDO automaticamente
-- ============================================================

DO $$
DECLARE
  wid UUID;
  sid UUID;
  w_start DATE;
  w_end DATE;
  w INT;
  d INT;
  i INT;
  user_data RECORD;
BEGIN
  -- 1. Criar 6 users em auth.users
  FOR user_data IN 
    SELECT * FROM (VALUES
      ('joao.silva@eqx.pt',   'João Silva',    'eqx2024!'),
      ('maria.santos@eqx.pt', 'Maria Santos',   'eqx2024!'),
      ('pedro.oliveira@eqx.pt','Pedro Oliveira', 'eqx2024!'),
      ('ana.costa@eqx.pt',    'Ana Costa',      'eqx2024!'),
      ('rui.ferreira@eqx.pt', 'Rui Ferreira',   'eqx2024!'),
      ('carla.martins@eqx.pt','Carla Martins',  'eqx2024!')
    ) AS t(email, full_name, password)
  LOOP
    wid := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data,
      aud, role, confirmation_token, recovery_token,
      created_at, updated_at, is_super_admin
    ) VALUES (
      wid,
      '00000000-0000-0000-0000-000000000000',
      user_data.email,
      crypt(user_data.password, gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', user_data.full_name),
      'authenticated',
      'authenticated',
      '',
      '',
      now(),
      now(),
      false
    );
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      wid,
      jsonb_build_object('sub', wid::text, 'email', user_data.email),
      'email',
      user_data.email,
      now(),
      now()
    );
    
    -- Trigger handle_new_user() creates the profile automatically
    
    -- 2. Criar 3 semanas de folhas para este worker
    FOR w IN 0..2 LOOP
      -- Calculate Monday of each week
      w_start := (date_trunc('week', CURRENT_DATE)::date - (w * 7));
      IF extract(dow from w_start) > 1 THEN
        w_start := w_start - (extract(dow from w_start)::int - 1);
      END IF;
      w_end := w_start + 5;
      
      INSERT INTO work_sheets (worker_id, week_start, week_end, client, work_number, status)
      VALUES (
        wid,
        w_start,
        w_end,
        (ARRAY['EDP Renováveis','Navais de Viana','Metro do Porto','Iberdrola','Galp Energia','Brisa','Altri Celbi','Somague'])[1 + floor(random() * 8)::int],
        'OB-' || to_char(w_start, 'YY') || '-' || lpad((floor(random() * 999) + 1)::text, 3, '0'),
        CASE w WHEN 0 THEN 'draft' ELSE 'submitted' END
      )
      RETURNING id INTO sid;
      
      -- 6 daily entries (Mon-Sat)
      FOR d IN 0..5 LOOP
        -- Saturday sometimes has no work
        IF d = 5 AND random() < 0.4 THEN
          INSERT INTO work_entries (sheet_id, day, date) VALUES (sid, 'saturday', w_start + d);
          CONTINUE;
        END IF;
        
        INSERT INTO work_entries (
          sheet_id, day, work_description, work_type, date,
          evaluation, signature, observations,
          start_time, end_time
        ) VALUES (
          sid,
          CASE d WHEN 0 THEN 'monday' WHEN 1 THEN 'tuesday' WHEN 2 THEN 'wednesday'
                 WHEN 3 THEN 'thursday' WHEN 4 THEN 'friday' ELSE 'saturday' END,
          (ARRAY[
            'Instalação de quadro elétrico geral','Ligação de tomadas industriais',
            'Manutenção preventiva de motores','Reparação de painel de controlo',
            'Soldadura de estruturas metálicas','Montagem de calhas e tubagens',
            'Teste de continuidade elétrica','Passagem de cabos de baixa tensão',
            'Inspeção de válvulas de segurança','Substituição de disjuntores',
            'Limpeza de permutadores de calor','Instalação de iluminação LED',
            'Certificação de instalação elétrica','Configuração de inversores',
            'Reparação de tubagens de vapor','Montagem de andaimes metálicos',
            'Ligação ao quadro geral BT','Verificação de terras de proteção'
          ])[1 + floor(random() * 18)::int],
          (ARRAY['new_installation','installation_continuation','preventive_maintenance','corrective_maintenance'])[1 + floor(random() * 4)::int],
          w_start + d,
          (ARRAY['Bom','Muito Bom','Satisfatório',''])[1 + floor(random() * 4)::int],
          left(user_data.full_name, 1) || left(split_part(user_data.full_name, ' ', 2), 1),
          CASE WHEN random() < 0.25 THEN (ARRAY['Aguardar material','Verificar com encarregado','Horas extra aprovadas'])[1 + floor(random() * 3)::int] ELSE '' END,
          ((7 + floor(random() * 2)::int)::text || ':' || lpad((floor(random() * 4) * 15)::text, 2, '0') || ':00')::time,
          ((16 + floor(random() * 2)::int)::text || ':' || lpad((floor(random() * 4) * 15)::text, 2, '0') || ':00')::time
        );
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ 6 trabalhadores × 3 semanas = 18 folhas + ~100 entradas criadas';
  RAISE NOTICE '📧 Logins: joao.silva, maria.santos, pedro.oliveira, ana.costa, rui.ferreira, carla.martins (@eqx.pt)';
  RAISE NOTICE '🔑 Password de todos: eqx2024!';
END;
$$;
