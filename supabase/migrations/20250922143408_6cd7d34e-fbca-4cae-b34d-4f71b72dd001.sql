-- Função para deletar trip e todos os dados relacionados em cascata
CREATE OR REPLACE FUNCTION public.delete_trip_cascade(trip_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reservation_record RECORD;
  payment_record RECORD;
BEGIN
  -- Verificar se existe o trip
  IF NOT EXISTS (SELECT 1 FROM trips WHERE id = trip_uuid) THEN
    RAISE EXCEPTION 'Trip não encontrado';
  END IF;

  -- 1. Deletar pagamentos relacionados às reservas do trip
  FOR reservation_record IN 
    SELECT id FROM reservations WHERE trip_id = trip_uuid
  LOOP
    DELETE FROM payments WHERE reservation_id = reservation_record.id;
  END LOOP;

  -- 2. Deletar reservas do trip
  DELETE FROM reservations WHERE trip_id = trip_uuid;

  -- 3. Deletar assentos dos ônibus do trip
  DELETE FROM bus_seats WHERE trip_id = trip_uuid;

  -- 4. Deletar ônibus do trip
  DELETE FROM buses WHERE trip_id = trip_uuid;

  -- 5. Finalmente deletar o trip
  DELETE FROM trips WHERE id = trip_uuid;

  -- Log da operação
  INSERT INTO audit_logs (action, table_name, record_id, old_values)
  VALUES ('DELETE_CASCADE', 'trips', trip_uuid, 
          jsonb_build_object('deleted_at', now(), 'deleted_by', auth.uid()));

END;
$$;