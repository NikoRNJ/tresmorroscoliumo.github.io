-- ==============================================
-- MIGRACIÓN: Agregar columnas para integración con Flow
-- Fecha: 2025-11-11
-- Iteración: 5
-- ==============================================

-- Agregar columna para almacenar el costo de personas extra
-- (Esta columna faltaba en el schema original)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS amount_extra_people NUMERIC(10, 2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN bookings.amount_extra_people IS 'Costo adicional por personas extra sobre capacity_base';

-- Agregar columna price_per_extra_person a cabins
-- (Esta columna faltaba en el schema original)
ALTER TABLE cabins 
ADD COLUMN IF NOT EXISTS price_per_extra_person NUMERIC(10, 2) DEFAULT 10000 NOT NULL CHECK (price_per_extra_person >= 0);

COMMENT ON COLUMN cabins.price_per_extra_person IS 'Precio por persona adicional sobre capacity_base (por noche)';

-- Las columnas flow_order_id y flow_payment_data ya existen en el schema
-- Verificar que existen (esto no falla si ya existen):
DO $$ 
BEGIN
  -- Verificar flow_order_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'flow_order_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN flow_order_id TEXT UNIQUE;
    COMMENT ON COLUMN bookings.flow_order_id IS 'ID de orden en Flow (flowOrder)';
  END IF;

  -- Verificar flow_payment_data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'flow_payment_data'
  ) THEN
    ALTER TABLE bookings ADD COLUMN flow_payment_data JSONB;
    COMMENT ON COLUMN bookings.flow_payment_data IS 'Datos completos de la respuesta de Flow API';
  END IF;
END $$;

-- Crear índice para flow_order_id si no existe
CREATE INDEX IF NOT EXISTS idx_bookings_flow_order ON bookings(flow_order_id);

-- ==============================================
-- ACTUALIZAR DATOS EXISTENTES DE CABAÑAS
-- (Solo si aún no tienen el precio correcto)
-- ==============================================

-- Actualizar las 3 cabañas con los precios correctos
UPDATE cabins SET 
  capacity_base = 2,
  capacity_max = 7,
  base_price = 55000,
  jacuzzi_price = 25000,
  price_per_extra_person = 10000
WHERE slug IN ('vegas-del-coliumo', 'caleta-del-medio', 'los-morros');

-- Verificar que todo está correcto
SELECT 
  slug,
  title,
  capacity_base,
  capacity_max,
  base_price,
  price_per_extra_person,
  jacuzzi_price
FROM cabins;
