-- Free seats when a reservation is cancelled or deleted

-- Function to free seats using provided array
CREATE OR REPLACE FUNCTION public._free_seats(seat_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF seat_ids IS NOT NULL AND array_length(seat_ids, 1) IS NOT NULL THEN
    UPDATE public.bus_seats
    SET status = 'disponivel', reserved_until = NULL
    WHERE id = ANY(seat_ids);
  END IF;
END;
$$;

-- Trigger: on reservation delete
CREATE OR REPLACE FUNCTION public.on_reservation_delete_free_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public._free_seats(OLD.seat_ids);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservations_after_delete_free_seats ON public.reservations;
CREATE TRIGGER trg_reservations_after_delete_free_seats
AFTER DELETE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.on_reservation_delete_free_seats();

-- Trigger: on reservation status update to 'cancelado'
CREATE OR REPLACE FUNCTION public.on_reservation_cancel_free_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'cancelado' AND COALESCE(OLD.status, '') <> 'cancelado' THEN
    PERFORM public._free_seats(NEW.seat_ids);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservations_after_update_cancel ON public.reservations;
CREATE TRIGGER trg_reservations_after_update_cancel
AFTER UPDATE OF status ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.on_reservation_cancel_free_seats();


