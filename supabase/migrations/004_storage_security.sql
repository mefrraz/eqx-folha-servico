-- ============================================================
-- STORAGE BUCKET SECURITY: rubricas
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Criar o bucket (se não existir)
-- Alternativa: criar via Supabase Dashboard > Storage > New Bucket "rubricas"

-- 2. Políticas de segurança no storage.objects
-- Upload: só authenticated users, ficheiros até 500KB, só imagens
CREATE POLICY "Users can upload own rubrica"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rubricas'
  AND (LOWER(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'))
);

-- Read: público (qualquer pessoa pode ver as rubricas)
CREATE POLICY "Anyone can read rubricas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'rubricas');

-- Delete: só o owner ou admin
CREATE POLICY "Owner or admin can delete rubrica"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rubricas'
  AND (
    owner = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr'))
  )
);

-- Update: só o owner
CREATE POLICY "Owner can update own rubrica"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'rubricas' AND owner = auth.uid())
WITH CHECK (bucket_id = 'rubricas' AND owner = auth.uid());
