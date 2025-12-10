-- =========================================================
-- Supabase schema para el panel de medios
-- Incluye soporte para cabañas (cabins), imagen principal e RLS
-- =========================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de categorías (opcional, para usos generales)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cabañas (alineada con el backend principal)
CREATE TABLE IF NOT EXISTS cabins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de imágenes (soporta categoría o cabaña e imagen principal)
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  alt VARCHAR(255),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  cabin_id UUID REFERENCES cabins(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT images_target_present CHECK (category_id IS NOT NULL OR cabin_id IS NOT NULL)
);

-- Tabla de productos (opcional)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_images_cabin ON images(cabin_id);
CREATE INDEX IF NOT EXISTS idx_images_order ON images(order_index);
CREATE UNIQUE INDEX IF NOT EXISTS idx_images_primary_cabin
  ON images(cabin_id)
  WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Trigger helper: updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cabins_updated_at
  BEFORE UPDATE ON cabins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Allow public read categories" ON categories
  FOR SELECT USING (true);
CREATE POLICY "Allow public read cabins" ON cabins
  FOR SELECT USING (true);
CREATE POLICY "Allow public read images" ON images
  FOR SELECT USING (true);
CREATE POLICY "Allow public read products" ON products
  FOR SELECT USING (true);

-- Escritura solo autenticados/service role
CREATE POLICY "Allow authenticated insert categories" ON categories
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update categories" ON categories
  FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete categories" ON categories
  FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert cabins" ON cabins
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update cabins" ON cabins
  FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete cabins" ON cabins
  FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert images" ON images
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update images" ON images
  FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete images" ON images
  FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert products" ON products
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update products" ON products
  FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete products" ON products
  FOR DELETE USING (true);

-- =============================================
-- Realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE images;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE cabins;

-- =============================================
-- Storage bucket (media)
-- =============================================
-- Crear bucket:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Allow public read storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Allow authenticated upload storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media');

CREATE POLICY "Allow authenticated delete storage" ON storage.objects
  FOR DELETE USING (bucket_id = 'media');

-- =============================================
-- Datos de ejemplo (opcional)
-- =============================================
INSERT INTO categories (name, slug, description) VALUES
  ('Hero', 'hero', 'Imágenes para el carrusel principal'),
  ('Productos', 'productos', 'Imágenes de productos'),
  ('Galería', 'galeria', 'Galería general de imágenes')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO cabins (slug, title, description) VALUES
  ('los-morros', 'Los Morros', 'Cabaña frente al mar'),
  ('caleta-del-medio', 'Caleta del Medio', 'Cabaña con vista a la caleta'),
  ('vegas-del-coliumo', 'Vegas del Coliumo', 'Cabaña con terraza amplia')
ON CONFLICT (slug) DO NOTHING;
