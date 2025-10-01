-- Corrigir trigger para funcionar tanto em INSERT quanto UPDATE
-- quando o status da reserva for 'pago'

DROP TRIGGER IF EXISTS trg_confirm_reservation_seats ON reservations;

CREATE OR REPLACE FUNCTION public.on_reservation_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Caso INSERT: se a reserva já foi criada como 'pago' ou 'confirmado'
  IF (TG_OP = 'INSERT') AND (NEW.status IN ('pago'::reservation_status)) THEN
    
    -- Chamar função de confirmação
    v_result := public.confirm_reservation_seats(NEW.id, auth.uid());
    
    -- Log do resultado
    RAISE NOTICE 'Atualização de assentos para reserva % (INSERT): %', NEW.id, v_result;
    
    -- Se falhou, ainda permite o insert mas loga o erro
    IF NOT (v_result->>'success')::boolean THEN
      RAISE WARNING 'Falha ao atualizar todos os assentos da reserva % (INSERT): %', 
        NEW.id, v_result->>'error';
    END IF;
  
  -- Caso UPDATE: quando status muda para 'pago'
  ELSIF (TG_OP = 'UPDATE') AND 
        (NEW.status IN ('pago'::reservation_status)) AND
        (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Chamar função de confirmação
    v_result := public.confirm_reservation_seats(NEW.id, auth.uid());
    
    -- Log do resultado
    RAISE NOTICE 'Atualização de assentos para reserva % (UPDATE): %', NEW.id, v_result;
    
    -- Se falhou, ainda permite o update mas loga o erro
    IF NOT (v_result->>'success')::boolean THEN
      RAISE WARNING 'Falha ao atualizar todos os assentos da reserva % (UPDATE): %', 
        NEW.id, v_result->>'error';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger para funcionar em INSERT e UPDATE
CREATE TRIGGER trg_confirm_reservation_seats
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_reservation_confirmed();