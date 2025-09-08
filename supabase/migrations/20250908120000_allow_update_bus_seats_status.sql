-- Enable RLS and allow authenticated updates to bus_seats status

-- Ensure RLS is enabled on bus_seats
ALTER TABLE public.bus_seats ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon/authenticated) to read seats so availability renders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'bus_seats' 
      AND policyname = 'Anyone can select bus seats'
  ) THEN
    CREATE POLICY "Anyone can select bus seats" ON public.bus_seats
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Allow authenticated users to update seat status/reserved_until
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'bus_seats' 
      AND policyname = 'Authenticated can update bus seats'
  ) THEN
    CREATE POLICY "Authenticated can update bus seats" ON public.bus_seats
      FOR UPDATE TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


