-- Iteración 7 · Correcciones críticas de reservas y horarios

-- Requerido para los constraints con EXCLUDE USING gist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Asegurar columnas para horarios normalizados
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS arrival_time TIME WITHOUT TIME ZONE NOT NULL DEFAULT '15:00';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS departure_time TIME WITHOUT TIME ZONE NOT NULL DEFAULT '12:00';

UPDATE bookings
SET
  arrival_time = COALESCE(arrival_time, '15:00'::time),
  departure_time = COALESCE(departure_time, '12:00'::time)
WHERE true;

-- Reemplazar el índice anterior por un constraint que cubra traslapes parciales
DROP INDEX IF EXISTS idx_bookings_no_overlap;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    cabin_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'paid'));

COMMENT ON CONSTRAINT bookings_no_overlap ON bookings
  IS 'Evita traslapes de reservas (pending/paid) permitiendo check-out y check-in el mismo día';


