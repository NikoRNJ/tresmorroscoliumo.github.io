-- ITERACIÓN 6: Sistema de emails con SendGrid
-- Agrega columnas para trackear envío de emails de confirmación

-- Agregar columna para timestamp de confirmación enviada
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_sent 
ON bookings(confirmation_sent_at) 
WHERE confirmation_sent_at IS NOT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN bookings.confirmation_sent_at IS 'Timestamp de cuando se envió el email de confirmación al cliente después del pago exitoso';

-- Verificar la estructura
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'confirmation_sent_at';
