-- DIAGNÓSTICO DE ACESSO AOS DADOS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas RLS da tabela destinations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'destinations'
ORDER BY policyname;

-- 2. Verificar políticas RLS da tabela trips
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trips'
ORDER BY policyname;

-- 3. Verificar políticas RLS da tabela reservations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reservations'
ORDER BY policyname;

-- 4. Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('destinations', 'trips', 'reservations', 'bus_seats')
ORDER BY tablename;

-- 5. Verificar dados existentes nas tabelas
SELECT 'destinations' as tabela, COUNT(*) as total FROM public.destinations
UNION ALL
SELECT 'trips' as tabela, COUNT(*) as total FROM public.trips
UNION ALL
SELECT 'reservations' as tabela, COUNT(*) as total FROM public.reservations
UNION ALL
SELECT 'bus_seats' as tabela, COUNT(*) as total FROM public.bus_seats;

-- 6. Verificar se há dados de exemplo
SELECT 'destinations' as tabela, name, state FROM public.destinations LIMIT 3
UNION ALL
SELECT 'trips' as tabela, 
       CONCAT('Trip ', id::text) as name, 
       CONCAT('Price: R$', price_individual::text) as state 
FROM public.trips LIMIT 3;

-- 7. Verificar usuário atual e perfil
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    (SELECT full_name FROM public.profiles WHERE user_id = auth.uid()) as current_user_name;

-- 8. Testar acesso aos dados como usuário autenticado
SELECT 
    'Teste de acesso' as status,
    (SELECT COUNT(*) FROM public.destinations) as destinations_count,
    (SELECT COUNT(*) FROM public.trips) as trips_count,
    (SELECT COUNT(*) FROM public.reservations WHERE user_id = auth.uid()) as my_reservations_count;
