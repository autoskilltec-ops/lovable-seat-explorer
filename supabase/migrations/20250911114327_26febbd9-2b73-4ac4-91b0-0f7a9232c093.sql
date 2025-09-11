-- Add departure time and duration fields to trips table
ALTER TABLE public.trips 
ADD COLUMN departure_time TIME,
ADD COLUMN duration_hours INTEGER;

-- Add default values for existing trips
UPDATE public.trips 
SET departure_time = '06:00:00', 
    duration_hours = 24 
WHERE departure_time IS NULL;

-- Make fields not null after setting defaults
ALTER TABLE public.trips 
ALTER COLUMN departure_time SET NOT NULL,
ALTER COLUMN duration_hours SET NOT NULL;

-- Allow admins to update destinations
CREATE POLICY "Admins can update destinations" 
ON public.destinations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Allow admins to update trips
CREATE POLICY "Admins can update trips" 
ON public.trips 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));