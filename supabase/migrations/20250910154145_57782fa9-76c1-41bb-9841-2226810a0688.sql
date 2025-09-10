-- Fix linter warnings: add explicit search_path to functions
CREATE OR REPLACE FUNCTION public._free_seats(seat_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  if seat_ids is not null and array_length(seat_ids, 1) is not null then
    update public.bus_seats
    set status = 'disponivel', reserved_until = null
    where id = any(seat_ids);
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.on_reservation_delete_free_seats()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  perform public._free_seats(old.seat_ids);
  return old;
end;
$function$;

CREATE OR REPLACE FUNCTION public.on_reservation_cancel_free_seats()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  seat_uuids uuid[];
BEGIN
  -- Caso DELETE (reserva excluída)
  IF TG_OP = 'DELETE' THEN
    IF OLD.seat_ids IS NOT NULL THEN
      seat_uuids := ARRAY(SELECT unnest(OLD.seat_ids)::uuid);
      UPDATE public.bus_seats
      SET status = 'disponivel',
          reserved_until = NULL
      WHERE id = ANY(seat_uuids);
    END IF;

  -- Caso UPDATE (reserva marcada como cancelada)
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelado'::reservation_status 
       AND OLD.seat_ids IS NOT NULL THEN
      seat_uuids := ARRAY(SELECT unnest(OLD.seat_ids)::uuid);
      UPDATE public.bus_seats
      SET status = 'disponivel',
          reserved_until = NULL
      WHERE id = ANY(seat_uuids);
    END IF;
  END IF;

  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_bus_seats_on_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  seat_uuids uuid[];
BEGIN
  -- Caso DELETE (reserva excluída)
  IF TG_OP = 'DELETE' THEN
    IF OLD.seat_ids IS NOT NULL THEN
      seat_uuids := ARRAY(SELECT unnest(OLD.seat_ids)::uuid);
      UPDATE public.bus_seats
      SET status = 'disponivel',
          reserved_until = NULL
      WHERE id = ANY(seat_uuids);
    END IF;

  -- Caso UPDATE (reserva marcada como cancelada)
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelado'::reservation_status AND OLD.seat_ids IS NOT NULL THEN
      seat_uuids := ARRAY(SELECT unnest(OLD.seat_ids)::uuid);
      UPDATE public.bus_seats
      SET status = 'disponivel',
          reserved_until = NULL
      WHERE id = ANY(seat_uuids);
    END IF;
  END IF;

  RETURN NULL;
END;
$function$;