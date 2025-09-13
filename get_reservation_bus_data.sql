-- Função para buscar dados dos ônibus relacionados às reservas
-- Execute este script no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION get_reservation_bus_data(reservation_id UUID)
RETURNS TABLE (
  bus_id UUID,
  bus_number INTEGER,
  total_seats INTEGER,
  available_seats INTEGER,
  occupied_seats INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bus_id,
    b.bus_number,
    COUNT(bs.id)::INTEGER as total_seats,
    COUNT(CASE WHEN bs.status = 'disponivel' THEN 1 END)::INTEGER as available_seats,
    COUNT(CASE WHEN bs.status = 'ocupado' THEN 1 END)::INTEGER as occupied_seats
  FROM reservations r
  JOIN bus_seats bs ON bs.id = ANY(r.seat_ids)
  JOIN buses b ON bs.bus_id = b.id
  WHERE r.id = reservation_id
  GROUP BY b.id, b.bus_number
  ORDER BY b.bus_number
  LIMIT 1; -- Retorna apenas o primeiro ônibus encontrado (o da reserva)
END;
$$;

-- Função para buscar dados de todos os ônibus de uma viagem (para admin)
CREATE OR REPLACE FUNCTION get_trip_buses_for_admin(trip_uuid UUID)
RETURNS TABLE (
  bus_id UUID,
  bus_number INTEGER,
  total_seats INTEGER,
  available_seats INTEGER,
  occupied_seats INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bus_id,
    b.bus_number,
    COUNT(bs.id)::INTEGER as total_seats,
    COUNT(CASE WHEN bs.status = 'disponivel' THEN 1 END)::INTEGER as available_seats,
    COUNT(CASE WHEN bs.status = 'ocupado' THEN 1 END)::INTEGER as occupied_seats
  FROM buses b
  LEFT JOIN bus_seats bs ON b.id = bs.bus_id
  WHERE b.trip_id = trip_uuid
  GROUP BY b.id, b.bus_number
  ORDER BY b.bus_number;
END;
$$;
