-- Fix security issues identified by the linter

-- Add RLS policy for audit_logs table
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Fix function search path security issues by setting search_path
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$$;

CREATE OR REPLACE FUNCTION clean_expired_seat_holds()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bus_seats 
  SET status = 'disponivel', reserved_until = NULL
  WHERE status = 'reservado_temporario' 
    AND reserved_until < now();
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;