-- Adicionar número de obra à tabela projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS number TEXT;
