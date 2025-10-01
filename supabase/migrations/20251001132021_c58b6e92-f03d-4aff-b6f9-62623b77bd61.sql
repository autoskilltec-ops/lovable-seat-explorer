-- Adicionar status 'reservado' ao enum de status de assentos
ALTER TYPE seat_status ADD VALUE IF NOT EXISTS 'reservado';

-- Atualizar função de confirmação para aceitar assentos 'reservado'
CREATE OR REPLACE FUNCTION public.confirm_reservation_seats(_reservation_id uuid, _performed_by uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seat_ids uuid[];
  v_trip_id uuid;
  v_seats_expected integer;
  v_seats_updated integer;
  v_failed_seats uuid[];
  v_result jsonb;
  v_seat_id uuid;
BEGIN
  -- Buscar seat_ids e trip_id da reserva
  SELECT seat_ids, trip_id 
  INTO v_seat_ids, v_trip_id
  FROM reservations
  WHERE id = _reservation_id;

  IF v_seat_ids IS NULL OR array_length(v_seat_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reserva não possui assentos',
      'seats_updated', 0,
      'seats_expected', 0
    );
  END IF;

  v_seats_expected := array_length(v_seat_ids, 1);
  v_failed_seats := ARRAY[]::uuid[];

  -- Tentar atualizar cada assento individualmente
  -- Aceita assentos em status 'reservado' ou 'disponivel'
  v_seats_updated := 0;
  FOREACH v_seat_id IN ARRAY v_seat_ids
  LOOP
    BEGIN
      UPDATE bus_seats
      SET 
        status = 'ocupado'::seat_status,
        reserved_until = NULL
      WHERE id = v_seat_id 
        AND status IN ('reservado'::seat_status, 'disponivel'::seat_status);
      
      IF FOUND THEN
        v_seats_updated := v_seats_updated + 1;
      ELSE
        v_failed_seats := array_append(v_failed_seats, v_seat_id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_failed_seats := array_append(v_failed_seats, v_seat_id);
      RAISE WARNING 'Erro ao atualizar assento %: %', v_seat_id, SQLERRM;
    END;
  END LOOP;

  -- Registrar auditoria
  INSERT INTO reservation_seat_audit (
    reservation_id,
    seat_ids,
    action,
    seats_updated,
    seats_expected,
    failed_seat_ids,
    error_message,
    performed_by
  ) VALUES (
    _reservation_id,
    v_seat_ids,
    'confirm',
    v_seats_updated,
    v_seats_expected,
    CASE WHEN array_length(v_failed_seats, 1) > 0 THEN v_failed_seats ELSE NULL END,
    CASE WHEN v_seats_updated < v_seats_expected 
         THEN format('Apenas %s de %s assentos foram atualizados', v_seats_updated, v_seats_expected)
         ELSE NULL 
    END,
    _performed_by
  );

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', v_seats_updated = v_seats_expected,
    'seats_updated', v_seats_updated,
    'seats_expected', v_seats_expected,
    'failed_seats', v_failed_seats
  );

  IF v_seats_updated < v_seats_expected THEN
    v_result := v_result || jsonb_build_object(
      'error', format('Apenas %s de %s assentos foram atualizados', v_seats_updated, v_seats_expected)
    );
  END IF;

  RETURN v_result;
END;
$$;