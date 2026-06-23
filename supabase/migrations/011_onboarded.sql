-- Adicionar coluna onboarded para tracking de primeiro login
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;
