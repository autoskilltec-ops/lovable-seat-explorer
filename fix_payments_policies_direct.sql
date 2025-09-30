-- Fix payments RLS policies to allow normal users to create payments
-- Execute this directly in the Supabase SQL Editor

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create own payments" ON payments;
DROP POLICY IF EXISTS "Verified admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;

-- Create proper user policies for payments
CREATE POLICY "Users can view own payments" 
ON payments FOR SELECT 
USING (
  auth.uid() = (
    SELECT r.user_id 
    FROM reservations r 
    WHERE r.id = payments.reservation_id
  )
);

CREATE POLICY "Users can create own payments" 
ON payments FOR INSERT 
WITH CHECK (
  auth.uid() = (
    SELECT r.user_id 
    FROM reservations r 
    WHERE r.id = payments.reservation_id
  )
);

-- Create admin policy that works with the verified admin function
CREATE POLICY "Verified admins can manage all payments"
ON payments FOR ALL
USING (public.is_verified_admin(auth.uid()))
WITH CHECK (public.is_verified_admin(auth.uid()));

-- Also ensure the payments table has RLS enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
