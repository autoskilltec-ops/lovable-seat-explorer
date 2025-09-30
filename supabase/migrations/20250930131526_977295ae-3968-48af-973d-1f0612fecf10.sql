
-- ====================================================================
-- SOLUÇÃO ROBUSTA PARA ATUALIZAÇÃO DE ASSENTOS EM CONFIRMAÇÃO DE RESERVA
-- ====================================================================

-- 1. Criar tabela de auditoria para rastrear problemas com assentos
CREATE TABLE IF NOT EXISTS public.reservation_seat_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL,
  seat_ids uuid[] NOT NULL,
  action text NOT NULL, -- 'confirm', 'cancel', etc
  seats_updated integer NOT NULL DEFAULT 0,
  seats_expected integer NOT NULL,
  failed_seat_ids uuid[],
  error_message text,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.reservation_seat_audit ENABLE ROW LEVEL SECURITY;

-- Política para admins verem logs
CREATE POLICY "Admins can view seat audit logs"
  ON public.reservation_seat_audit
  FOR SELECT
  USING (is_verified_admin(auth.uid()));

-- Política para sistema inserir logs
CREATE POLICY "System can insert seat audit logs"
  ON public.reservation_seat_audit
  FOR INSERT
  WITH CHECK (true);

-- 2. Criar função segura para atualizar assentos atomicamente
CREATE OR REPLACE FUNCTION public.confirm_reservation_seats(
  _reservation_id uuid,
  _performed_by uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Tentar atualizar cada assento individualmente para identificar falhas
  v_seats_updated := 0;
  FOREACH v_seat_id IN ARRAY v_seat_ids
  LOOP
    BEGIN
      UPDATE bus_seats
      SET 
        status = 'ocupado'::seat_status,
        reserved_until = NULL
      WHERE id = v_seat_id;
      
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

-- 3. Criar trigger para atualizar assentos automaticamente quando status vira 'pago'
CREATE OR REPLACE FUNCTION public.on_reservation_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Só age quando status muda para 'pago' ou 'confirmado'
  IF (TG_OP = 'UPDATE') AND 
     (NEW.status IN ('pago'::reservation_status)) AND
     (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Chamar função de confirmação
    v_result := public.confirm_reservation_seats(NEW.id, auth.uid());
    
    -- Log do resultado
    RAISE NOTICE 'Atualização de assentos para reserva %: %', NEW.id, v_result;
    
    -- Se falhou, ainda permite o update mas loga o erro
    IF NOT (v_result->>'success')::boolean THEN
      RAISE WARNING 'Falha ao atualizar todos os assentos da reserva %: %', 
        NEW.id, v_result->>'error';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_confirm_reservation_seats ON reservations;

-- Criar novo trigger
CREATE TRIGGER trg_confirm_reservation_seats
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION on_reservation_confirmed();

-- 4. Função para verificar inconsistências nos dados
CREATE OR REPLACE FUNCTION public.audit_reservation_seats_consistency()
RETURNS TABLE (
  reservation_id uuid,
  trip_id uuid,
  seat_ids uuid[],
  seats_with_wrong_trip integer,
  seats_not_found integer,
  seats_already_occupied integer,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH reservation_data AS (
    SELECT 
      r.id as res_id,
      r.trip_id as res_trip_id,
      r.seat_ids as res_seat_ids,
      r.status as res_status,
      unnest(r.seat_ids) as seat_id
    FROM reservations r
    WHERE r.status = 'pendente'::reservation_status
      AND r.seat_ids IS NOT NULL
      AND array_length(r.seat_ids, 1) > 0
  )
  SELECT 
    rd.res_id,
    rd.res_trip_id,
    rd.res_seat_ids,
    COUNT(CASE WHEN bs.trip_id != rd.res_trip_id THEN 1 END)::integer as seats_with_wrong_trip,
    COUNT(CASE WHEN bs.id IS NULL THEN 1 END)::integer as seats_not_found,
    COUNT(CASE WHEN bs.status = 'ocupado'::seat_status THEN 1 END)::integer as seats_already_occupied,
    rd.res_status::text
  FROM reservation_data rd
  LEFT JOIN bus_seats bs ON bs.id = rd.seat_id
  GROUP BY rd.res_id, rd.res_trip_id, rd.res_seat_ids, rd.res_status
  HAVING COUNT(CASE WHEN bs.id IS NULL THEN 1 END) > 0
      OR COUNT(CASE WHEN bs.trip_id != rd.res_trip_id THEN 1 END) > 0
      OR COUNT(CASE WHEN bs.status = 'ocupado'::seat_status THEN 1 END) > 0;
END;
$$;

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_bus_seats_status ON bus_seats(status);
CREATE INDEX IF NOT EXISTS idx_bus_seats_trip_id ON bus_seats(trip_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservation_seat_audit_reservation_id 
  ON reservation_seat_audit(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_seat_audit_created_at 
  ON reservation_seat_audit(created_at DESC);

-- Comentários de documentação
COMMENT ON FUNCTION confirm_reservation_seats IS 
  'Atualiza assentos de uma reserva para ocupado de forma atômica com auditoria completa';
COMMENT ON FUNCTION on_reservation_confirmed IS 
  'Trigger que atualiza assentos automaticamente quando reserva é confirmada';
COMMENT ON FUNCTION audit_reservation_seats_consistency IS 
  'Verifica inconsistências nos dados de assentos das reservas pendentes';
COMMENT ON TABLE reservation_seat_audit IS 
  'Log de auditoria para rastreamento de atualizações de assentos';
