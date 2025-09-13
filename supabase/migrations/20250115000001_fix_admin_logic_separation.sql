-- Fix admin logic to ensure it's not affected by customer data
-- This migration ensures that admin role is only determined by the profiles table
-- and not by customer data that might be stored there

-- Update the is_admin function to be more specific about admin verification
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id 
    AND p.role = 'admin'::user_role
    AND p.email IS NOT NULL
    AND p.email != ''
  );
$$;

-- Update the is_verified_admin function to be more strict
CREATE OR REPLACE FUNCTION public.is_verified_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _verified boolean := false;
  _profile_exists boolean := false;
  _is_admin_role boolean := false;
BEGIN
  -- Check if user has confirmed email in auth.users
  SELECT COALESCE(u.email_confirmed_at IS NOT NULL, false)
  INTO _verified
  FROM auth.users u
  WHERE u.id = _user_id;

  -- Check if profile exists and has admin role
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id 
    AND p.role = 'admin'::user_role
    AND p.email IS NOT NULL
    AND p.email != ''
  ) INTO _is_admin_role;

  -- Return true only if user is verified AND has admin role
  RETURN _verified AND _is_admin_role;
END;
$fn$;

-- Add constraint to ensure profiles.email is not empty for admin users
ALTER TABLE public.profiles 
ADD CONSTRAINT check_admin_email_not_empty 
CHECK (
  (role = 'admin' AND email IS NOT NULL AND email != '') 
  OR (role != 'admin' OR role IS NULL)
);

-- Create a function to clean up any existing data that might cause conflicts
CREATE OR REPLACE FUNCTION public.cleanup_profile_conflicts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $cleanup$
BEGIN
  -- Update profiles where email is empty but role is admin
  UPDATE public.profiles 
  SET role = 'user'::user_role
  WHERE role = 'admin'::user_role 
  AND (email IS NULL OR email = '');
  
  -- Log the cleanup
  INSERT INTO public.audit_logs (action, table_name, record_id, user_id, new_values)
  VALUES (
    'cleanup_profile_conflicts',
    'profiles',
    NULL,
    NULL,
    json_build_object('cleaned_admin_profiles', 'profiles with empty email and admin role set to user')
  );
END;
$cleanup$;

-- Run the cleanup function
SELECT public.cleanup_profile_conflicts();

-- Add comment explaining the separation
COMMENT ON TABLE public.profiles IS 'User authentication profiles - admin role management only. Customer data stored in customer_data table.';
COMMENT ON TABLE public.customer_data IS 'Customer information for reservations - separate from authentication to prevent admin role conflicts.';
