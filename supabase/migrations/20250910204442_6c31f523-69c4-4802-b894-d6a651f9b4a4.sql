-- Fix permission denied by removing direct references to auth.users in RLS policies
-- PROFILES: drop admin policies to avoid recursion/forbidden schema access
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- RESERVATIONS: replace admin policy to use security definer function
DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;

CREATE POLICY "Verified admins can manage all reservations"
ON reservations FOR ALL
USING (public.is_verified_admin(auth.uid()))
WITH CHECK (public.is_verified_admin(auth.uid()));

-- PAYMENTS: replace admin policy to use security definer function
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;

CREATE POLICY "Verified admins can manage all payments"
ON payments FOR ALL
USING (public.is_verified_admin(auth.uid()))
WITH CHECK (public.is_verified_admin(auth.uid()));