-- ==============================================
-- TRES MORROS DE COLIUMO - DATABASE SCHEMA
-- Fecha: 2025-11-11
-- Autor: Sistema de Reservas
-- 
-- IMPORTANTE: Este schema está actualizado con:
-- - Capacidad: 7 personas (todas las cabañas)
-- - Precio base: $55.000 CLP por noche
-- - Jacuzzi: $25.000 CLP por día
-- ==============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ==============================================
-- TABLA: cabins
-- Descripción: Almacena información de las 3 cabañas
-- ==============================================
CREATE TABLE IF NOT EXISTS cabins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  capacity_base INTEGER NOT NULL CHECK (capacity_base > 0),
  capacity_max INTEGER NOT NULL CHECK (capacity_max >= capacity_base),
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price > 0),
  jacuzzi_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (jacuzzi_price >= 0),
  amenities JSONB DEFAULT '[]'::jsonb,
  location_details TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para cabins
CREATE INDEX idx_cabins_slug ON cabins(slug);
CREATE INDEX idx_cabins_active ON cabins(active);

-- Comentarios
COMMENT ON TABLE cabins IS 'Información de las cabañas disponibles para reserva';
COMMENT ON COLUMN cabins.slug IS 'Identificador único URL-friendly (ej: vegas-del-coliumo)';
COMMENT ON COLUMN cabins.capacity_base IS 'Capacidad base incluida en precio base';
COMMENT ON COLUMN cabins.capacity_max IS 'Capacidad máxima permitida';
COMMENT ON COLUMN cabins.base_price IS 'Precio por noche en CLP';
COMMENT ON COLUMN cabins.jacuzzi_price IS 'Precio adicional por día de jacuzzi en CLP';

-- ==============================================
-- TABLA: cabin_images
-- Descripción: Imágenes de cada cabaña
-- ==============================================
CREATE TABLE IF NOT EXISTS cabin_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabin_id UUID NOT NULL REFERENCES cabins(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para cabin_images
CREATE INDEX idx_cabin_images_cabin_id ON cabin_images(cabin_id);
CREATE INDEX idx_cabin_images_sort_order ON cabin_images(cabin_id, sort_order);

-- Asegurar solo una imagen primaria por cabaña
CREATE UNIQUE INDEX idx_cabin_images_primary ON cabin_images(cabin_id) 
  WHERE is_primary = true;

COMMENT ON TABLE cabin_images IS 'Galería de imágenes de cada cabaña';
COMMENT ON COLUMN cabin_images.is_primary IS 'Imagen principal que se muestra en listados';

-- ==============================================
-- TABLA: bookings
-- Descripción: Reservas de cabañas
-- ==============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabin_id UUID NOT NULL REFERENCES cabins(id) ON DELETE RESTRICT,
  
  -- Fechas de la reserva
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  nights INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
  arrival_time TIME NOT NULL DEFAULT '15:00',
  departure_time TIME NOT NULL DEFAULT '12:00',
  
  -- Información de huéspedes
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  
  -- Jacuzzi (array de fechas donde se solicitó jacuzzi)
  jacuzzi_days JSONB DEFAULT '[]'::jsonb,
  
  -- Estado de la reserva
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'paid', 'expired', 'canceled')),
  
  -- Información de pago
  flow_order_id TEXT UNIQUE,
  flow_payment_data JSONB,
  amount_base NUMERIC(10, 2) NOT NULL,
  amount_jacuzzi NUMERIC(10, 2) DEFAULT 0,
  amount_total NUMERIC(10, 2) NOT NULL,
  
  -- Información del cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Para holds temporales de 20 minutos
  paid_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ
);

-- Índices para bookings
CREATE INDEX idx_bookings_cabin_id ON bookings(cabin_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_flow_order ON bookings(flow_order_id);
CREATE INDEX idx_bookings_expires_at ON bookings(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Prevenir reservas superpuestas (permite check-out y check-in el mismo día)
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    cabin_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  )
  WHERE status IN ('pending', 'paid');

COMMENT ON TABLE bookings IS 'Reservas de cabañas (incluye pending holds y confirmadas)';
COMMENT ON COLUMN bookings.status IS 'pending=hold temporal, paid=confirmada, expired=hold expirado, canceled=cancelada';
COMMENT ON COLUMN bookings.expires_at IS 'Momento en que expira el hold (20 min desde creación)';
COMMENT ON COLUMN bookings.jacuzzi_days IS 'Array de fechas ISO donde se solicita jacuzzi: ["2025-12-25", "2025-12-26"]';

-- ==============================================
-- TABLA: admin_blocks
-- Descripción: Bloqueos manuales de fechas (mantenimiento, etc)
-- ==============================================
CREATE TABLE IF NOT EXISTS admin_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabin_id UUID NOT NULL REFERENCES cabins(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  reason TEXT,
  created_by TEXT, -- Email del admin que creó el bloqueo
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para admin_blocks
CREATE INDEX idx_admin_blocks_cabin_id ON admin_blocks(cabin_id);
CREATE INDEX idx_admin_blocks_dates ON admin_blocks(start_date, end_date);

COMMENT ON TABLE admin_blocks IS 'Bloqueos administrativos de fechas (mantenimiento, reparaciones)';

-- ==============================================
-- TABLA: api_events
-- Descripción: Log de eventos importantes (webhooks, pagos, emails)
-- ==============================================
CREATE TABLE IF NOT EXISTS api_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- 'webhook_received', 'payment_success', 'email_sent', etc
  event_source TEXT NOT NULL, -- 'flow', 'sendgrid', 'system'
  booking_id UUID REFERENCES bookings(id),
  payload JSONB,
  status TEXT, -- 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para api_events
CREATE INDEX idx_api_events_type ON api_events(event_type);
CREATE INDEX idx_api_events_booking ON api_events(booking_id);
CREATE INDEX idx_api_events_created ON api_events(created_at DESC);

COMMENT ON TABLE api_events IS 'Log de eventos del sistema para debugging y auditoría';

-- ==============================================
-- FUNCIONES AUXILIARES
-- ==============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cabins
CREATE TRIGGER update_cabins_updated_at
  BEFORE UPDATE ON cabins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- DATOS INICIALES (SEED)
-- ==============================================

-- Insertar las 3 cabañas con los datos actualizados
INSERT INTO cabins (slug, title, description, capacity_base, capacity_max, base_price, jacuzzi_price, amenities, location_details)
VALUES 
  (
    'vegas-del-coliumo',
    'Vegas del Coliumo',
    'Cabaña amplia con vista panorámica al mar, terraza privada y acceso directo a la playa. Perfecta para familias que buscan tranquilidad y contacto con la naturaleza.',
    2,
    7,
    55000,
    25000,
    '["Terraza privada", "Vista al mar", "Acceso a playa", "Parrilla", "Cocina equipada", "WiFi", "Estacionamiento"]'::jsonb,
    'Ubicada en la zona alta con vistas privilegiadas al Océano Pacífico'
  ),
  (
    'caleta-del-medio',
    'Caleta del Medio',
    'Acogedora cabaña cercana a la caleta de pescadores artesanales. Ideal para familias que desean experimentar la vida costera auténtica.',
    2,
    7,
    55000,
    25000,
    '["Cerca de caleta", "Vista al mar", "Cocina equipada", "Parrilla", "WiFi", "Estacionamiento"]'::jsonb,
    'A pasos de la caleta de pescadores, ambiente tranquilo y familiar'
  ),
  (
    'los-morros',
    'Los Morros',
    'Cabaña espaciosa y luminosa con jacuzzi opcional y vistas espectaculares a los característicos morros de Coliumo. Perfecta para grupos grandes.',
    2,
    7,
    55000,
    25000,
    '["Vista a los Morros", "Jacuzzi disponible", "Amplio living", "Cocina completa", "Parrilla", "WiFi", "Estacionamiento", "Terraza"]'::jsonb,
    'Vista privilegiada a los morros, ambiente de lujo campestre'
  )
ON CONFLICT (slug) DO NOTHING;

-- ==============================================
-- VERIFICACIÓN
-- ==============================================

-- Verificar que las 3 cabañas se insertaron correctamente
SELECT id, slug, title, capacity_max, base_price, jacuzzi_price FROM cabins;

-- Debe mostrar:
-- vegas-del-coliumo  | Vegas del Coliumo  | 7 | 55000 | 25000
-- caleta-del-medio   | Caleta del Medio   | 7 | 55000 | 25000
-- los-morros         | Los Morros         | 7 | 55000 | 25000

-- Verificar estructura de tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Debe mostrar:
-- admin_blocks
-- api_events
-- bookings
-- cabin_images
-- cabins

-- ==============================================
-- FIN DEL SCHEMA
-- ==============================================
