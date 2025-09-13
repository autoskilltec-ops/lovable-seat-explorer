-- Ensure profiles table is used only for authentication, not customer data
-- This migration adds constraints and triggers to prevent customer data from interfering with admin logic

-- Add constraint to ensure profiles.email matches auth.users.email for consistency
CREATE OR REPLACE FUNCTION public.enforce_profile_email_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $consistency$
DECLARE
  auth_email text;
BEGIN
  -- Get the email from auth.users
  SELECT email INTO auth_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- If auth email exists, ensure profile email matches
  IF auth_email IS NOT NULL AND NEW.email != auth_email THEN
    NEW.email := auth_email;
  END IF;
  
  RETURN NEW;
END;
$consistency$;

-- Create trigger to enforce email consistency
DROP TRIGGER IF EXISTS enforce_profile_email_consistency ON public.profiles;
CREATE TRIGGER enforce_profile_email_consistency
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_email_consistency();

-- Add constraint to prevent empty emails for admin users
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS check_admin_email_not_empty;

ALTER TABLE public.profiles 
ADD CONSTRAINT check_admin_email_not_empty 
CHECK (
  (role = 'admin' AND email IS NOT NULL AND email != '' AND email ~ '^[^@]+@[^@]+\.[^@]+$') 
  OR (role != 'admin' OR role IS NULL)
);

-- Create function to validate admin assignment
CREATE OR REPLACE FUNCTION public.validate_admin_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $validate$
BEGIN
  -- Only allow admin role assignment if email is valid and confirmed
  IF NEW.role = 'admin'::user_role THEN
    -- Check if email is valid format
    IF NEW.email IS NULL OR NEW.email = '' OR NEW.email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
      RAISE EXCEPTION 'Admin users must have a valid email address';
    END IF;
    
    -- Check if email is confirmed in auth.users
    IF NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = NEW.user_id 
      AND email = NEW.email 
      AND email_confirmed_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Admin users must have a confirmed email address';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$validate$;

-- Create trigger to validate admin assignment
DROP TRIGGER IF EXISTS validate_admin_assignment ON public.profiles;
CREATE TRIGGER validate_admin_assignment
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_assignment();

-- Update existing profiles to ensure consistency
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users
WHERE profiles.user_id = auth_users.id 
AND profiles.email != auth_users.email
AND auth_users.email IS NOT NULL;

-- Remove any admin roles from profiles with invalid emails
UPDATE public.profiles 
SET role = 'user'::user_role
WHERE role = 'admin'::user_role 
AND (
  email IS NULL 
  OR email = '' 
  OR email !~ '^[^@]+@[^@]+\.[^@]+$'
  OR NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = profiles.user_id 
    AND email = profiles.email 
    AND email_confirmed_at IS NOT NULL
  )
);

-- Add index for better performance on admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role ON public.profiles(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON public.profiles(user_id, role);
