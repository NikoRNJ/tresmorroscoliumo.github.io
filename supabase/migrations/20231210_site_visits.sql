-- ============================================
-- Tabla para rastrear visitantes únicos del sitio
-- Almacena IPs hasheadas por privacidad (GDPR-compliant)
-- ============================================

CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- IP hasheada con SHA-256 (no almacenamos IP real por privacidad)
  ip_hash TEXT NOT NULL,
  -- Ruta visitada
  path TEXT NOT NULL DEFAULT '/',
  -- User agent simplificado (solo tipo de dispositivo)
  device_type TEXT DEFAULT 'unknown',
  -- Referrer (de dónde viene el usuario)
  referrer TEXT,
  -- País detectado (opcional)
  country TEXT,
  -- Timestamp de la visita
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Fecha sin hora para agregaciones diarias
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_site_visits_ip_hash ON site_visits(ip_hash);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON site_visits(path);

-- Índice compuesto para conteo de visitantes únicos por día
CREATE INDEX IF NOT EXISTS idx_site_visits_unique_daily 
ON site_visits(visit_date, ip_hash);

-- Vista para estadísticas agregadas diarias
CREATE OR REPLACE VIEW daily_visit_stats AS
SELECT 
  visit_date,
  COUNT(*) as total_visits,
  COUNT(DISTINCT ip_hash) as unique_visitors,
  COUNT(DISTINCT CASE WHEN path = '/' THEN ip_hash END) as homepage_visitors,
  COUNT(DISTINCT CASE WHEN path LIKE '/cabanas%' THEN ip_hash END) as cabin_visitors,
  COUNT(DISTINCT CASE WHEN path LIKE '/galeria%' THEN ip_hash END) as gallery_visitors,
  COUNT(DISTINCT CASE WHEN path LIKE '/reservar%' THEN ip_hash END) as booking_visitors
FROM site_visits
GROUP BY visit_date
ORDER BY visit_date DESC;

-- Comentarios
COMMENT ON TABLE site_visits IS 'Registro de visitas al sitio para métricas de admin';
COMMENT ON COLUMN site_visits.ip_hash IS 'Hash SHA-256 de la IP del visitante (privacidad)';
COMMENT ON COLUMN site_visits.device_type IS 'Tipo: desktop, mobile, tablet, bot';
