-- Create customer_data table to separate customer information from authentication profiles
-- This prevents conflicts with admin role management

CREATE TABLE IF NOT EXISTS public.customer_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  customer_cpf text,
  emergency_contact text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_data_user_id ON public.customer_data(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_data_email ON public.customer_data(customer_email);

-- Enable RLS
ALTER TABLE public.customer_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_data
-- Users can only see their own customer data
CREATE POLICY "Users can view own customer data"
ON public.customer_data
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own customer data
CREATE POLICY "Users can insert own customer data"
ON public.customer_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own customer data
CREATE POLICY "Users can update own customer data"
ON public.customer_data
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own customer data
CREATE POLICY "Users can delete own customer data"
ON public.customer_data
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all customer data
CREATE POLICY "Admins can view all customer data"
ON public.customer_data
FOR SELECT
USING (public.is_verified_admin(auth.uid()));

-- Admins can update all customer data
CREATE POLICY "Admins can update all customer data"
ON public.customer_data
FOR UPDATE
USING (public.is_verified_admin(auth.uid()))
WITH CHECK (public.is_verified_admin(auth.uid()));

-- Admins can delete all customer data
CREATE POLICY "Admins can delete all customer data"
ON public.customer_data
FOR DELETE
USING (public.is_verified_admin(auth.uid()));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_customer_data_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_data_updated_at
  BEFORE UPDATE ON public.customer_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_data_updated_at();

-- Add comment to table
COMMENT ON TABLE public.customer_data IS 'Customer information separate from authentication profiles to prevent admin role conflicts';
