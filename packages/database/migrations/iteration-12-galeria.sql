-- ==============================================
-- GALERIA TABLE MIGRATION
-- Date: 2025-12-09
-- Description: Generic gallery for categories like Bautizos, Bodas, etc.
-- ==============================================

-- Create the galeria table for generic image galleries
CREATE TABLE IF NOT EXISTS galeria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  storage_path TEXT,                    -- Path in Supabase Storage bucket
  category TEXT NOT NULL,               -- e.g., "Bautizos", "Bodas"
  position INTEGER NOT NULL DEFAULT 0,  -- For ordering in carousel/gallery
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_galeria_category ON galeria(category);
CREATE INDEX IF NOT EXISTS idx_galeria_position ON galeria(category, position);

-- Comments for documentation
COMMENT ON TABLE galeria IS 'Generic image gallery organized by categories (Bautizos, Bodas, Eventos, etc.)';
COMMENT ON COLUMN galeria.image_url IS 'Public URL of the image in Supabase Storage';
COMMENT ON COLUMN galeria.storage_path IS 'Internal path within the media bucket';
COMMENT ON COLUMN galeria.category IS 'Category name for grouping images (e.g., Bautizos, Bodas)';
COMMENT ON COLUMN galeria.position IS 'Order position within category, lower = first in carousel';
COMMENT ON COLUMN galeria.alt_text IS 'Alternative text for accessibility';

-- Verification
SELECT 'galeria table created successfully' AS status;
