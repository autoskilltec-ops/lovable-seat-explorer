-- Create policy to allow admins to insert new trips
CREATE POLICY "Admins can create trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM profiles
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));