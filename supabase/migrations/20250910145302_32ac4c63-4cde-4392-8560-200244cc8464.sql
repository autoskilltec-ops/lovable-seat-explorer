-- First, add bus_quantity to trips table
ALTER TABLE public.trips 
ADD COLUMN bus_quantity INTEGER NOT NULL DEFAULT 1 CHECK (bus_quantity >= 1 AND bus_quantity <= 3);

-- Update the buses table to ensure proper structure
CREATE TABLE IF NOT EXISTS public.buses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  bus_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(trip_id, bus_number)
);

-- Enable RLS on buses table
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

-- Create policies for buses table
CREATE POLICY "Anyone can view buses" 
ON public.buses 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create buses" 
ON public.buses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
));

CREATE POLICY "System can create buses for trips" 
ON public.buses 
FOR INSERT 
WITH CHECK (true);

-- Update bus_seats table to reference buses properly
-- First, check if bus_id column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bus_seats' AND column_name = 'bus_id') THEN
        ALTER TABLE public.bus_seats ADD COLUMN bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bus_seats_bus_id ON public.bus_seats(bus_id);
CREATE INDEX IF NOT EXISTS idx_buses_trip_id ON public.buses(trip_id);

-- Create a function to get available buses for a trip
CREATE OR REPLACE FUNCTION get_trip_buses(trip_uuid UUID)
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