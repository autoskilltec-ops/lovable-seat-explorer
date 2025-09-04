-- Add missing columns to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_cpf TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add missing column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id);

-- Update reservations to have seat_ids column for storing selected seats
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS seat_ids TEXT[] DEFAULT '{}';