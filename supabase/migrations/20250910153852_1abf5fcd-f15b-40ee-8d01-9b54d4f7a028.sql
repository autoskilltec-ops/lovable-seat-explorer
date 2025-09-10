-- Strengthen security around sensitive reservation data
-- 1) Helper functions for admin checks
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id AND p.role = 'admin'::user_role
  );
$$;

-- Verified admins must have confirmed email in auth.users
CREATE OR REPLACE FUNCTION public.is_verified_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _verified boolean := false;
BEGIN
  SELECT COALESCE(u.email_confirmed_at IS NOT NULL, false)
  INTO _verified
  FROM auth.users u
  WHERE u.id = _user_id;

  RETURN _verified AND public.is_admin(_user_id);
END;
$fn$;

-- 2) Prevent privilege escalation on profiles.role
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $trg$
BEGIN
  -- If "role" is being changed, enforce that the current user is an admin
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$trg$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();

-- 3) Tighten reservations access to verified admins only
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON public.reservations;

CREATE POLICY "Verified admins can view all reservations"
ON public.reservations
FOR SELECT
USING (public.is_verified_admin(auth.uid()));

CREATE POLICY "Verified admins can update all reservations"
ON public.reservations
FOR UPDATE
USING (public.is_verified_admin(auth.uid()));