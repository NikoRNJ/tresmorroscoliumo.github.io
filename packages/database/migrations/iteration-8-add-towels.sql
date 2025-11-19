-- Migration: Add towels support to bookings
-- Date: 2025-11-19

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS towels_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_towels NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN bookings.towels_count IS 'Cantidad de toallas adicionales solicitadas';
COMMENT ON COLUMN bookings.amount_towels IS 'Costo total de las toallas adicionales';
