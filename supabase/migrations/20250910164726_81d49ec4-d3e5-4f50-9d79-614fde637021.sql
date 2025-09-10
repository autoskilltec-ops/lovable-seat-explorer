-- Strengthen profiles security and prevent role escalation

-- 1) Verified admin access for read/update (without exposing to general users)
DROP POLICY IF EXISTS "Verified admins can view all profiles" ON public.profiles;
CREATE POLICY "Verified admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_verified_admin(auth.uid()));

DROP POLICY IF EXISTS "Verified admins can update profiles" ON public.profiles;
CREATE POLICY "Verified admins can update profiles"
ON public.profiles
FOR UPDATE
USING (public.is_verified_admin(auth.uid()));

-- 2) Triggers to prevent role escalation and enforce defaults
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_security()
RETURNS trigger AS $$
BEGIN
  -- Force standard users to have role 'user'
  IF NOT public.is_verified_admin(auth.uid()) THEN
    NEW.role := 'user'::user_role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.enforce_profile_update_role_security()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_verified_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only verified admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_enforce_insert ON public.profiles;
CREATE TRIGGER profiles_enforce_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_insert_security();

DROP TRIGGER IF EXISTS profiles_enforce_role_update ON public.profiles;
CREATE TRIGGER profiles_enforce_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_role_security();
