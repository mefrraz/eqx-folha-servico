-- ============================================================
-- CRIAR ADMIN — colaboradoreshoraseqx@gmail.com / eqx2030
-- Executar no Supabase SQL Editor
-- NÃO faz DELETE, só insere o admin se não existir
-- ============================================================

DO $$
DECLARE
  admin_id UUID;
  admin_email TEXT := 'colaboradoreshoraseqx@gmail.com';
  admin_password TEXT := 'eqx2030';
  admin_name TEXT := 'Admin EQX';
BEGIN
  -- Ver se já existe
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

  IF admin_id IS NULL THEN
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
      '{"provider":"email","providers":["email"]}'::jsonb,  -- raw_app_meta_data
      jsonb_build_object('full_name', admin_name),           -- raw_user_meta_data
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

    RAISE NOTICE '✅ Admin criado: % / %', admin_email, admin_password;
  ELSE
    RAISE NOTICE '⚠️ Admin já existe com id: %', admin_id;
  END IF;

  -- Garantir que o perfil é admin
  INSERT INTO profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (admin_id, admin_name, admin_email, 'admin', now(), now())
  ON CONFLICT (id) DO UPDATE SET role = 'admin', email = admin_email, updated_at = now();

  RAISE NOTICE '✅ Perfil admin confirmado';
END;
$$;
