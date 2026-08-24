-- ============================================================
-- v7.14: Lembrete de sexta-feira
-- Adiciona 'reminder_friday' aos tipos de email permitidos
-- ============================================================

ALTER TABLE weekly_email_log DROP CONSTRAINT IF EXISTS weekly_email_log_email_type_check;
ALTER TABLE weekly_email_log ADD CONSTRAINT weekly_email_log_email_type_check
  CHECK (email_type IN ('reminder', 'stats', 'reminder_friday'));
