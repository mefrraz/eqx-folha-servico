-- ============================================================
-- LIMPAR DADOS + CRIAR ADMIN colaboradoreshoraseqx@gmail.com
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Apagar todos os dados (mantém schema e admin existente se quiseres)
DELETE FROM notifications;
DELETE FROM work_entries;
DELETE FROM work_sheets;
DELETE FROM projects;
DELETE FROM clients;
DELETE FROM profiles;
DELETE FROM auth.users;

-- 2. Criar admin novo
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
BEGIN
  -- Inserir em auth.users
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

  -- Inserir em auth.identities
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

  -- Inserir em profiles
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (admin_id, 'Admin EQX', 'colaboradoreshoraseqx@gmail.com', 'admin');

  RAISE NOTICE '✅ Admin criado: colaboradoreshoraseqx@gmail.com / eqx2030';
END;
$$;
