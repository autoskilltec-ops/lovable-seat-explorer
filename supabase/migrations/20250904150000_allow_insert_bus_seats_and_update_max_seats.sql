-- Ensure we can create new seats (46-60) from the client app
-- RLS: allow insert on bus_seats (public write)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'bus_seats' 
      AND policyname = 'Anyone can insert bus seats'
  ) THEN
    CREATE POLICY "Anyone can insert bus seats" ON public.bus_seats
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Optional: raise max seats default to 60 for future trips
ALTER TABLE public.trips 
  ALTER COLUMN max_seats SET DEFAULT 60;

-- Backfill: create seats 46-60 for trips that still have only 45 seats
INSERT INTO public.bus_seats (trip_id, seat_number, status)
SELECT t.id, gs.seat_num, 'disponivel'::seat_status
FROM public.trips t
JOIN LATERAL (
  SELECT generate_series(46, 60) AS seat_num
) gs ON TRUE
LEFT JOIN public.bus_seats bs 
  ON bs.trip_id = t.id AND bs.seat_number = gs.seat_num
WHERE bs.id IS NULL;

