-- ============================================
-- Crear bucket 'galeria' en Supabase Storage
-- ============================================
-- IMPORTANTE: Este SQL debe ejecutarse en Supabase SQL Editor

-- Crear el bucket público para galería
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'galeria',
  'galeria', 
  true,  -- Público para que las imágenes sean accesibles
  10485760,  -- 10MB límite por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Política para permitir lectura pública
CREATE POLICY IF NOT EXISTS "Galeria images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'galeria');

-- Política para permitir uploads solo con service_role (admin)
-- (Las APIs del admin usan service_role key, así que no necesitan políticas adicionales)

-- Verificar que el bucket fue creado
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'galeria';
