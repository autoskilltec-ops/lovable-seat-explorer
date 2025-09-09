-- Create policy to allow admins to insert new destinations
CREATE POLICY "Admins can create destinations" 
ON public.destinations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM profiles
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));