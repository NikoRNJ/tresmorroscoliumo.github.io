-- Atomic hold creation via RPC to avoid race conditions
-- Creates a function that checks admin blocks, relies on exclusion constraint for overlaps, and logs codes

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
BEGIN
  -- Check admin blocks overlap
  IF EXISTS (
    SELECT 1 FROM admin_blocks
    WHERE cabin_id = p_cabin_id
      AND start_date < p_end_date
      AND end_date > p_start_date
  ) THEN
    RAISE EXCEPTION 'DATES_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

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
