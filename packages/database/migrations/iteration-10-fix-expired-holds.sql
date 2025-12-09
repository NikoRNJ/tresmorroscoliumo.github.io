-- ==============================================
-- ITERATION 10: FIX EXPIRED HOLDS BLOCKING NEW RESERVATIONS
-- Fecha: 2025-11-28
-- 
-- PROBLEMA: Los holds expirados (expires_at < NOW()) mantienen
-- status='pending' y bloquean nuevas reservas por el constraint
-- de exclusión, aunque la API de disponibilidad los muestre como
-- disponibles.
--
-- SOLUCIÓN: Modificar el RPC atómico para expirar holds vencidos
-- ANTES de intentar insertar una nueva reserva.
-- ==============================================

-- Actualizar función RPC para expirar holds antes de insertar
CREATE OR REPLACE FUNCTION create_booking_hold_atomic(
  p_cabin_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_arrival_time TIME WITHOUT TIME ZONE,
  p_departure_time TIME WITHOUT TIME ZONE,
  p_party_size INTEGER,
  p_jacuzzi_days JSONB,
  p_towels_count INTEGER,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_customer_notes TEXT,
  p_expires_at TIMESTAMPTZ,
  p_amount_base NUMERIC(10,2),
  p_amount_jacuzzi NUMERIC(10,2),
  p_amount_extra_people NUMERIC(10,2),
  p_amount_towels NUMERIC(10,2),
  p_amount_total NUMERIC(10,2)
)
RETURNS bookings AS $$
DECLARE
  result bookings;
  expired_count INTEGER;
BEGIN
  -- ============================================
  -- PASO 1: EXPIRAR HOLDS VENCIDOS QUE SOLAPAN
  -- ============================================
  -- Esto es CRÍTICO: el constraint bookings_no_overlap incluye
  -- status='pending' sin considerar expires_at. Debemos marcar
  -- como 'expired' cualquier hold vencido ANTES de insertar.
  UPDATE bookings
  SET status = 'expired'
  WHERE cabin_id = p_cabin_id
    AND status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND start_date < p_end_date
    AND end_date > p_start_date;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log para debugging (visible en logs de Supabase)
  IF expired_count > 0 THEN
    RAISE NOTICE '[create_booking_hold_atomic] Expired % stale holds for cabin % overlapping [%, %)', 
      expired_count, p_cabin_id, p_start_date, p_end_date;
  END IF;

  -- ============================================
  -- PASO 2: VERIFICAR ADMIN BLOCKS
  -- ============================================
  IF EXISTS (
    SELECT 1 FROM admin_blocks
    WHERE cabin_id = p_cabin_id
      AND start_date < p_end_date
      AND end_date > p_start_date
  ) THEN
    RAISE EXCEPTION 'DATES_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  -- ============================================
  -- PASO 3: INSERTAR NUEVO HOLD
  -- ============================================
  -- Si hay otro hold activo (no expirado), el constraint
  -- bookings_no_overlap lanzará exclusion_violation
  INSERT INTO bookings (
    cabin_id,
    start_date,
    end_date,
    arrival_time,
    departure_time,
    party_size,
    jacuzzi_days,
    status,
    amount_base,
    amount_jacuzzi,
    amount_extra_people,
    amount_towels,
    amount_total,
    towels_count,
    customer_name,
    customer_email,
    customer_phone,
    customer_notes,
    expires_at
  )
  VALUES (
    p_cabin_id,
    p_start_date,
    p_end_date,
    p_arrival_time,
    p_departure_time,
    p_party_size,
    COALESCE(p_jacuzzi_days, '[]'::jsonb),
    'pending',
    p_amount_base,
    p_amount_jacuzzi,
    p_amount_extra_people,
    p_amount_towels,
    p_amount_total,
    COALESCE(p_towels_count, 0),
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_customer_notes,
    p_expires_at
  )
  RETURNING * INTO result;

  RETURN result;
EXCEPTION
  WHEN unique_violation OR exclusion_violation THEN
    -- Otro usuario creó un hold válido entre el UPDATE y el INSERT
    RAISE EXCEPTION 'DATES_UNAVAILABLE' USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN AUXILIAR: Expirar holds vencidos globalmente
-- Útil para llamar antes de consultas de disponibilidad
-- ============================================
CREATE OR REPLACE FUNCTION expire_stale_holds()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE bookings
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Expirar holds para una cabaña específica
-- ============================================
CREATE OR REPLACE FUNCTION expire_stale_holds_for_cabin(p_cabin_id UUID)
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE bookings
  SET status = 'expired'
  WHERE cabin_id = p_cabin_id
    AND status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Actualizar comentario en schema
-- ============================================
COMMENT ON COLUMN bookings.expires_at IS 'Momento en que expira el hold (45 min desde creación). Los holds expirados se marcan automáticamente como expired.';

-- ============================================
-- LIMPIEZA INICIAL: Expirar todos los holds vencidos existentes
-- ============================================
DO $$
DECLARE
  cleaned INTEGER;
BEGIN
  UPDATE bookings
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS cleaned = ROW_COUNT;
  RAISE NOTICE 'Initial cleanup: expired % stale holds', cleaned;
END $$;
