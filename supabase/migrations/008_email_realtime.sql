-- ============================================================
-- EMAIL NOTIFICATIONS via pg_net (tempo real, grátis)
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Ativar extensão pg_net (faz pedidos HTTP a partir de triggers)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função que envia email via a API do Vercel
CREATE OR REPLACE FUNCTION notify_email_send()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  api_url TEXT := 'https://eqx-folha-servico.vercel.app/api/cron/notify-emails';
BEGIN
  -- Faz o pedido HTTP em background (async)
  PERFORM net.http_post(
    url := api_url,
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger que dispara o email quando uma notificação é criada
DROP TRIGGER IF EXISTS on_notification_email ON notifications;
CREATE TRIGGER on_notification_email
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_email_send();

-- 4. Adicionar coluna emailed_at (se ainda não existir)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;

RAISE NOTICE '✅ Email notifications em tempo real ativadas!';
RAISE NOTICE '⚠️ Verifica se a extensão pg_net está ativa em: Supabase Dashboard → Database → Extensions';
