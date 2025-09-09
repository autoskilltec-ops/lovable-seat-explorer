-- Create policy to allow admins to insert bus seats (for automatic seat creation)
CREATE POLICY "Admins can create bus seats" 
ON public.bus_seats 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM profiles
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Create policy to allow the system to insert bus seats automatically 
-- This is needed for when new trips are created and seats need to be generated
CREATE POLICY "System can create bus seats for trips" 
ON public.bus_seats 
FOR INSERT 
WITH CHECK (true);