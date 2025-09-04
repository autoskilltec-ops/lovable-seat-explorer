-- Fix database schema issues
-- Add missing columns to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_cpf TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add missing column to payments table  
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id);

-- Drop and recreate the payment_method enum with correct values
DROP TYPE IF EXISTS payment_method CASCADE;
CREATE TYPE payment_method AS ENUM ('pix', 'cartao_credito', 'cartao_debito');

-- Update the payments table to use the new enum
ALTER TABLE public.payments 
ALTER COLUMN method TYPE payment_method USING method::text::payment_method;

-- Update payment_method_preference to use the same enum
ALTER TABLE public.payments 
ALTER COLUMN payment_method_preference TYPE payment_method USING payment_method_preference::text::payment_method;