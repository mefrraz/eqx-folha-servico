-- ============================================================
-- LIMPAR TUDO + CRIAR ADMIN LIMPO
-- Executar no Supabase SQL Editor
-- ============================================================

-- Apagar dados (ordem correcta, sem TRUNCATE para não partir auth)
DELETE FROM notifications;
DELETE FROM work_entries;
DELETE FROM work_sheets;
DELETE FROM projects;
DELETE FROM clients;
DELETE FROM profiles;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- Criar admin com todas as colunas
DO $$
DECLARE
  admin_id UUID;
  admin_email TEXT := 'colaboradoreshoraseqx@gmail.com';
  admin_password TEXT := 'eqx2030';
  admin_name TEXT := 'Admin EQX';
BEGIN
  admin_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    invited_at, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at,
    email_change_token_new, email_change, email_change_sent_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, deleted_at,
    created_at, updated_at, phone,
    phone_confirmed_at, phone_change, phone_change_token,
    phone_change_sent_at, email_change_token_current,
    banned_until,
    reauthentication_token, reauthentication_sent_at
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(),        -- email_confirmed_at
    NULL,          -- invited_at
    '',            -- confirmation_token
    NULL,          -- confirmation_sent_at
    '',            -- recovery_token
    NULL,          -- recovery_sent_at
    '',            -- email_change_token_new
    '',            -- email_change
    NULL,          -- email_change_sent_at
    now(),         -- last_sign_in_at
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', admin_name),
    false,         -- is_super_admin
    false,         -- is_sso_user
    NULL,          -- deleted_at
    now(),         -- created_at
    now(),         -- updated_at
    NULL,          -- phone
    NULL,          -- phone_confirmed_at
    '',            -- phone_change
    '',            -- phone_change_token
    NULL,          -- phone_change_sent_at
    '',            -- email_change_token_current
    NULL,          -- banned_until
    '',            -- reauthentication_token
    NULL           -- reauthentication_sent_at
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', admin_email, 'email_verified', true),
    'email',
    admin_email,
    now(),
    now(),
    now()
  );

  INSERT INTO profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (admin_id, admin_name, admin_email, 'admin', now(), now());

  RAISE NOTICE '✅ Admin: % / %', admin_email, admin_password;
END;
$$;
