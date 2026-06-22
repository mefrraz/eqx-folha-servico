-- ============================================================
-- LIMPAR DADOS + CRIAR ADMIN (v2 — robusto)
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Apagar dados das tabelas da app (ordem correcta)
DELETE FROM notifications;
DELETE FROM work_entries;
DELETE FROM work_sheets;
DELETE FROM projects;
DELETE FROM clients;
DELETE FROM profiles;

-- 2. Apagar auth users (excepto o admin que vamos criar)
-- Usa CASCADE para lidar com FK internas (sessions, refresh_tokens, etc.)
TRUNCATE auth.users CASCADE;

-- 3. Criar admin
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    aud, role, confirmation_token, recovery_token,
    created_at, updated_at, is_super_admin, is_sso_user, deleted_at
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'colaboradoreshoraseqx@gmail.com',
    crypt('eqx2030', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Admin EQX'),
    '{"provider":"email","providers":["email"]}',
    'authenticated',
    'authenticated',
    '',
    '',
    now(),
    now(),
    false,
    false,
    NULL
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', 'colaboradoreshoraseqx@gmail.com'),
    'email',
    'colaboradoreshoraseqx@gmail.com',
    now(),
    now()
  );

  -- Trigger handle_new_user insere o profile automaticamente
  -- Garantir que fica como admin
  UPDATE profiles SET role = 'admin', email = 'colaboradoreshoraseqx@gmail.com'
  WHERE id = admin_id;

  RAISE NOTICE '✅ Admin: colaboradoreshoraseqx@gmail.com / eqx2030';
END;
$$;
