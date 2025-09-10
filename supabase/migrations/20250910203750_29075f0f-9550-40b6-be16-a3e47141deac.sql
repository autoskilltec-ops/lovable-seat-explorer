-- Fix infinite recursion in profiles RLS policies
-- Remove duplicate and potentially recursive policies

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Admin pode ver todos os dados" ON profiles;
DROP POLICY IF EXISTS "Admin pode ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Cada usuário edita seu perfil" ON profiles;
DROP POLICY IF EXISTS "Cada usuário vê seu perfil" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Verified admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Verified admins can view all profiles" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create admin policies without recursion 
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- Ensure reservations policies are working correctly
-- Drop and recreate reservation policies to be sure they work
DROP POLICY IF EXISTS "Admin pode ver todas reservas" ON reservations;
DROP POLICY IF EXISTS "Cada usuário altera suas reservas" ON reservations;
DROP POLICY IF EXISTS "Cada usuário cria suas reservas" ON reservations;
DROP POLICY IF EXISTS "Cada usuário vê suas reservas" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Verified admins can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Verified admins can view all reservations" ON reservations;

-- Create clean reservation policies
CREATE POLICY "Users can view own reservations" 
ON reservations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations" 
ON reservations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" 
ON reservations FOR UPDATE 
USING (auth.uid() = user_id);

-- Admin policy for reservations without recursion
CREATE POLICY "Admins can manage all reservations" 
ON reservations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- Fix payments policies too
DROP POLICY IF EXISTS "Admin pode ver todos pagamentos" ON payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Cada usuário cria seus pagamentos" ON payments;
DROP POLICY IF EXISTS "Cada usuário vê seus pagamentos" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Create clean payment policies
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

-- Admin policy for payments
CREATE POLICY "Admins can manage all payments" 
ON payments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- Add trigger to ensure profile creation on user signup if not exists
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  RETURN NEW;
END;
$$;