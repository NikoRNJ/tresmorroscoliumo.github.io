-- ==============================================
-- ITERATION 11: CORRECCIÓN DEFINITIVA DEL SISTEMA DE HOLDS
-- Fecha: 2025-12-02
-- 
-- DIAGNÓSTICO DEL PROBLEMA:
-- ========================
-- El constraint `bookings_no_overlap` bloquea reservas basándose SOLO
-- en `status IN ('pending', 'paid')`, pero NO considera `expires_at`.
-- 
-- Esto causa que:
-- 1. Usuario A crea hold → status='pending', expires_at=NOW()+45min
-- 2. Pasan 46 minutos → hold sigue con status='pending' (no se actualizó)
-- 3. API de disponibilidad muestra fecha como "disponible" (verifica expires_at)
-- 4. Usuario B intenta reservar → FALLA por el constraint (no verifica expires_at)
-- 
-- SOLUCIÓN:
-- =========
-- PostgreSQL NO permite usar NOW() en constraints EXCLUDE USING gist.
-- Por eso debemos:
-- 1. Actualizar proactivamente holds expirados a status='expired'
-- 2. Crear trigger para marcar automáticamente holds vencidos
-- 3. Actualizar funciones RPC para expirar antes de operar
-- ==============================================

-- ============================================
-- PASO 1: LIMPIEZA INICIAL
-- Marcar como 'expired' todos los holds vencidos
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
  RAISE NOTICE '[Iteration 11] Limpieza inicial: % holds expirados actualizados', cleaned;
END $$;

-- ============================================
-- PASO 2: FUNCIÓN PARA EXPIRAR HOLDS GLOBALMENTE
-- (recrear para asegurar que existe)
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

COMMENT ON FUNCTION expire_stale_holds() IS 
  'Marca como expired todos los holds con expires_at vencido. Llamar periódicamente o antes de consultas.';

-- ============================================
-- PASO 3: FUNCIÓN PARA EXPIRAR HOLDS DE UNA CABAÑA
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

COMMENT ON FUNCTION expire_stale_holds_for_cabin(UUID) IS 
  'Marca como expired los holds vencidos de una cabaña específica.';

-- ============================================
-- PASO 4: FUNCIÓN RPC ATÓMICA MEJORADA
-- Expira holds vencidos ANTES de verificar disponibilidad
-- ============================================
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
  -- CRÍTICO: El constraint bookings_no_overlap incluye
  -- status='pending' sin considerar expires_at. 
  -- Debemos marcar como 'expired' cualquier hold vencido
  -- ANTES de intentar insertar.
  UPDATE bookings
  SET status = 'expired'
  WHERE cabin_id = p_cabin_id
    AND status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND start_date < p_end_date
    AND end_date > p_start_date;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  IF expired_count > 0 THEN
    RAISE NOTICE '[create_booking_hold_atomic] Expirados % holds vencidos para cabaña % en rango [%, %)', 
      expired_count, p_cabin_id, p_start_date, p_end_date;
  END IF;

  -- ============================================
  -- PASO 2: VERIFICAR BLOQUEOS ADMINISTRATIVOS
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
    RAISE EXCEPTION 'DATES_UNAVAILABLE' USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_booking_hold_atomic IS 
  'Crea un hold de reserva de forma atómica. Expira holds vencidos antes de insertar para evitar conflictos con el constraint.';

-- ============================================
-- PASO 5: FUNCIÓN PARA VERIFICAR DISPONIBILIDAD
-- (útil para validaciones adicionales)
-- ============================================
CREATE OR REPLACE FUNCTION check_dates_available(
  p_cabin_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  has_conflict BOOLEAN;
BEGIN
  -- Primero expirar holds vencidos que solapan
  UPDATE bookings
  SET status = 'expired'
  WHERE cabin_id = p_cabin_id
    AND status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND start_date < p_end_date
    AND end_date > p_start_date;
  
  -- Verificar si hay conflictos con reservas activas
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE cabin_id = p_cabin_id
      AND status IN ('pending', 'paid')
      AND start_date < p_end_date
      AND end_date > p_start_date
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      -- Para pending, verificar que no esté expirado
      AND (status = 'paid' OR (status = 'pending' AND expires_at > NOW()))
  ) INTO has_conflict;
  
  -- También verificar bloqueos administrativos
  IF NOT has_conflict THEN
    SELECT EXISTS (
      SELECT 1 FROM admin_blocks
      WHERE cabin_id = p_cabin_id
        AND start_date < p_end_date
        AND end_date > p_start_date
    ) INTO has_conflict;
  END IF;
  
  RETURN NOT has_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_dates_available IS 
  'Verifica si las fechas están disponibles para reserva, expirando holds vencidos primero.';

-- ============================================
-- PASO 6: ÍNDICE PARA ACELERAR CONSULTAS DE EXPIRACIÓN
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_pending_expires 
  ON bookings(cabin_id, expires_at) 
  WHERE status = 'pending' AND expires_at IS NOT NULL;

COMMENT ON INDEX idx_bookings_pending_expires IS 
  'Acelera búsquedas de holds pendientes que pueden estar expirados.';

-- ============================================
-- PASO 7: TRIGGER OPCIONAL PARA AUTO-EXPIRAR
-- (se ejecuta cuando se consulta la tabla)
-- 
-- NOTA: Este trigger es OPCIONAL y puede afectar
-- ligeramente el rendimiento. Descomentarlo si se
-- prefiere expiración automática en cada consulta.
-- ============================================
/*
CREATE OR REPLACE FUNCTION trigger_expire_stale_holds()
RETURNS TRIGGER AS $$
BEGIN
  -- Expirar holds vencidos de la misma cabaña
  UPDATE bookings
  SET status = 'expired'
  WHERE cabin_id = NEW.cabin_id
    AND status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expire_stale_holds ON bookings;
CREATE TRIGGER trg_expire_stale_holds
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_expire_stale_holds();
*/

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
DO $$
DECLARE
  pending_expired INTEGER;
  pending_active INTEGER;
BEGIN
  -- Contar holds pendientes expirados (no deberían existir)
  SELECT COUNT(*) INTO pending_expired
  FROM bookings
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  -- Contar holds pendientes activos
  SELECT COUNT(*) INTO pending_active
  FROM bookings
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at >= NOW();
  
  RAISE NOTICE '=== VERIFICACIÓN POST-MIGRACIÓN ===';
  RAISE NOTICE 'Holds pendientes expirados (deberían ser 0): %', pending_expired;
  RAISE NOTICE 'Holds pendientes activos: %', pending_active;
  RAISE NOTICE '===================================';
  
  IF pending_expired > 0 THEN
    RAISE WARNING '⚠️ Hay % holds con status=pending pero expires_at vencido. Ejecutar expire_stale_holds() manualmente.', pending_expired;
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
