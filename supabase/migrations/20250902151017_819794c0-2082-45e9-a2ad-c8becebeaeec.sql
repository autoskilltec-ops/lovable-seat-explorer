-- Create enum types for better data integrity
CREATE TYPE reservation_status AS ENUM ('pendente', 'pago', 'cancelado');
CREATE TYPE payment_status AS ENUM ('iniciado', 'aprovado', 'recusado', 'cancelado');
CREATE TYPE payment_method AS ENUM ('pix', 'cartao');
CREATE TYPE seat_status AS ENUM ('disponivel', 'reservado_temporario', 'ocupado');
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create destinations table
CREATE TABLE public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES destinations(id) NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  price_individual DECIMAL(10,2) NOT NULL,
  price_couple DECIMAL(10,2) NOT NULL,
  price_group DECIMAL(10,2) NOT NULL,
  includes_accommodation BOOLEAN DEFAULT true,
  includes_breakfast BOOLEAN DEFAULT true,
  max_seats INTEGER DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create bus seats table
CREATE TABLE public.bus_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  seat_number INTEGER NOT NULL,
  status seat_status DEFAULT 'disponivel',
  reserved_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, seat_number)
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) NOT NULL,
  seat_ids UUID[] NOT NULL,
  plan_type TEXT NOT NULL, -- 'individual', 'casal', 'grupo'
  passengers INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status reservation_status DEFAULT 'pendente',
  codigo_confirmacao TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'iniciado',
  installments INTEGER DEFAULT 1,
  transacao_ref TEXT,
  stripe_session_id TEXT,
  pix_payload TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample destinations
INSERT INTO public.destinations (id, name, state, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Fortaleza', 'CE', 'Belas praias e cultura nordestina'),
('550e8400-e29b-41d4-a716-446655440002', 'Natal', 'RN', 'Dunas e praias paradisíacas');

-- Insert sample trips
INSERT INTO public.trips (id, destination_id, departure_date, return_date, price_individual, price_couple, price_group) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-02-15', '2024-02-18', 980.00, 920.00, 899.00),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '2024-03-01', '2024-03-04', 980.00, 920.00, 899.00),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2024-02-22', '2024-02-25', 980.00, 920.00, 899.00),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-03-08', '2024-03-11', 980.00, 920.00, 899.00);

-- Create bus seats for each trip (45 seats per bus)
INSERT INTO public.bus_seats (trip_id, seat_number)
SELECT t.id, generate_series(1, 45)
FROM trips t;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for destinations and trips (public read)
CREATE POLICY "Anyone can view destinations" ON destinations FOR SELECT USING (true);
CREATE POLICY "Anyone can view trips" ON trips FOR SELECT USING (true);
CREATE POLICY "Anyone can view bus seats" ON bus_seats FOR SELECT USING (true);

-- RLS Policies for reservations
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM reservations WHERE id = reservation_id)
  );
CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM reservations WHERE id = reservation_id)
  );

-- Admin policies
CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update all reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update all payments" ON payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update bus seats" ON bus_seats
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Functions for generating confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired seat holds
CREATE OR REPLACE FUNCTION clean_expired_seat_holds()
RETURNS void AS $$
BEGIN
  UPDATE bus_seats 
  SET status = 'disponivel', reserved_until = NULL
  WHERE status = 'reservado_temporario' 
    AND reserved_until < now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservations_updated_at 
  BEFORE UPDATE ON reservations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();