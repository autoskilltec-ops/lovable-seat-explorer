-- Finalize customer data separation from profiles table
-- This migration ensures complete separation between authentication and customer data

-- Create a view for easy access to customer data with user info
CREATE OR REPLACE VIEW public.customer_data_with_user AS
SELECT 
  cd.*,
  p.email as auth_email,
  p.full_name as auth_name,
  p.phone as auth_phone,
  p.role as user_role
FROM public.customer_data cd
LEFT JOIN public.profiles p ON cd.user_id = p.user_id;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.customer_data_with_user TO authenticated;

-- Create a function to get customer data for a user
CREATE OR REPLACE FUNCTION public.get_customer_data(_user_id uuid)
RETURNS TABLE (
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_cpf text,
  emergency_contact text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cd.customer_name,
    cd.customer_phone,
    cd.customer_email,
    cd.customer_cpf,
    cd.emergency_contact
  FROM public.customer_data cd
  WHERE cd.user_id = _user_id;
$$;

-- Create a function to update customer data
CREATE OR REPLACE FUNCTION public.update_customer_data(
  _user_id uuid,
  _customer_name text,
  _customer_phone text DEFAULT NULL,
  _customer_email text DEFAULT NULL,
  _customer_cpf text DEFAULT NULL,
  _emergency_contact text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() != _user_id AND NOT public.is_verified_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own customer data';
  END IF;

  -- Upsert customer data
  INSERT INTO public.customer_data (
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    customer_cpf,
    emergency_contact
  ) VALUES (
    _user_id,
    _customer_name,
    _customer_phone,
    _customer_email,
    _customer_cpf,
    _emergency_contact
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    customer_email = EXCLUDED.customer_email,
    customer_cpf = EXCLUDED.customer_cpf,
    emergency_contact = EXCLUDED.emergency_contact,
    updated_at = now();
END;
$$;

-- Create a function to clean up orphaned customer data
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_customer_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete customer data for users that no longer exist
  DELETE FROM public.customer_data 
  WHERE user_id NOT IN (
    SELECT id FROM auth.users
  );
  
  -- Log the cleanup
  INSERT INTO public.audit_logs (action, table_name, record_id, user_id, new_values)
  VALUES (
    'cleanup_orphaned_customer_data',
    'customer_data',
    NULL,
    NULL,
    json_build_object('cleaned_orphaned_data', 'customer data for non-existent users removed')
  );
END;
$$;

-- Add unique constraint on user_id for customer_data to prevent duplicates
ALTER TABLE public.customer_data 
ADD CONSTRAINT unique_customer_data_user_id UNIQUE (user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customer_data_user_id_unique ON public.customer_data(user_id);

-- Add comment to explain the separation
COMMENT ON FUNCTION public.get_customer_data(uuid) IS 'Get customer data for a specific user - separate from authentication profiles';
COMMENT ON FUNCTION public.update_customer_data(uuid, text, text, text, text, text) IS 'Update customer data for a user - separate from authentication profiles';
COMMENT ON VIEW public.customer_data_with_user IS 'View combining customer data with authentication profile info for admin purposes';
