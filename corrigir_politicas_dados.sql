-- CORREÇÃO DAS POLÍTICAS RLS PARA ACESSO AOS DADOS
-- Execute este script no SQL Editor do Supabase

-- 1. Limpar todas as políticas existentes das tabelas de dados
DROP POLICY IF EXISTS "Anyone can view destinations" ON destinations;
DROP POLICY IF EXISTS "Anyone can view trips" ON trips;
DROP POLICY IF EXISTS "Anyone can view bus seats" ON bus_seats;
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Verified admins can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Verified admins can view all reservations" ON reservations;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas para destinations (acesso público de leitura)
CREATE POLICY "Public can view destinations" 
ON destinations FOR SELECT 
USING (true);

-- 4. Criar políticas para trips (acesso público de leitura)
CREATE POLICY "Public can view trips" 
ON trips FOR SELECT 
USING (true);

-- 5. Criar políticas para bus_seats (acesso público de leitura)
CREATE POLICY "Public can view bus seats" 
ON bus_seats FOR SELECT 
USING (true);

-- 6. Criar políticas para reservations (usuários veem apenas suas próprias)
CREATE POLICY "Users can view own reservations" 
ON reservations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations" 
ON reservations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" 
ON reservations FOR UPDATE 
USING (auth.uid() = user_id);

-- 7. Políticas de admin para reservations
CREATE POLICY "Admins can manage all reservations" 
ON reservations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- 8. Políticas de admin para destinations
CREATE POLICY "Admins can manage destinations" 
ON destinations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- 9. Políticas de admin para trips
CREATE POLICY "Admins can manage trips" 
ON trips FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- 10. Políticas de admin para bus_seats
CREATE POLICY "Admins can manage bus seats" 
ON bus_seats FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- 11. Verificar se há dados nas tabelas
SELECT 
    'destinations' as tabela, 
    COUNT(*) as total,
    (SELECT COUNT(*) FROM destinations WHERE name IS NOT NULL) as com_nome
FROM destinations
UNION ALL
SELECT 
    'trips' as tabela, 
    COUNT(*) as total,
    (SELECT COUNT(*) FROM trips WHERE destination_id IS NOT NULL) as com_destino
FROM trips
UNION ALL
SELECT 
    'bus_seats' as tabela, 
    COUNT(*) as total,
    (SELECT COUNT(*) FROM bus_seats WHERE trip_id IS NOT NULL) as com_trip
FROM bus_seats
UNION ALL
SELECT 
    'reservations' as tabela, 
    COUNT(*) as total,
    (SELECT COUNT(*) FROM reservations WHERE user_id IS NOT NULL) as com_usuario
FROM reservations;

-- 12. Inserir dados de exemplo se as tabelas estiverem vazias
INSERT INTO public.destinations (id, name, state, description, image_url) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Fortaleza',
    'CE',
    'Belas praias e cultura nordestina',
    '/assets/fortaleza-destination.jpg'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Fortaleza');

INSERT INTO public.destinations (id, name, state, description, image_url) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'Natal',
    'RN',
    'Dunas e praias paradisíacas',
    '/assets/natal-destination.jpg'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Natal');

-- 13. Inserir trips de exemplo se não existirem
INSERT INTO public.trips (id, destination_id, departure_date, return_date, departure_time, duration_hours, price_individual, price_couple, price_group, includes_accommodation, includes_breakfast, max_seats) 
SELECT 
    '650e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '2024-12-15'::date,
    '2024-12-18'::date,
    '06:00:00'::time,
    24,
    980.00,
    920.00,
    899.00,
    true,
    true,
    45
WHERE NOT EXISTS (SELECT 1 FROM trips WHERE destination_id = '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO public.trips (id, destination_id, departure_date, return_date, departure_time, duration_hours, price_individual, price_couple, price_group, includes_accommodation, includes_breakfast, max_seats) 
SELECT 
    '650e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '2024-12-22'::date,
    '2024-12-25'::date,
    '06:00:00'::time,
    24,
    980.00,
    920.00,
    899.00,
    true,
    true,
    45
WHERE NOT EXISTS (SELECT 1 FROM trips WHERE destination_id = '550e8400-e29b-41d4-a716-446655440002');

-- 14. Criar assentos para as viagens se não existirem
INSERT INTO public.bus_seats (trip_id, seat_number, status)
SELECT 
    t.id,
    generate_series(1, 45),
    'disponivel'
FROM trips t
WHERE NOT EXISTS (SELECT 1 FROM bus_seats WHERE trip_id = t.id);

-- 15. Verificação final
SELECT 
    'Correção concluída!' as status,
    (SELECT COUNT(*) FROM destinations) as destinations_count,
    (SELECT COUNT(*) FROM trips) as trips_count,
    (SELECT COUNT(*) FROM bus_seats) as seats_count,
    (SELECT COUNT(*) FROM reservations) as reservations_count;
