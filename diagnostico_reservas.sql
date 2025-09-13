-- DIAGNÓSTICO ESPECÍFICO PARA PROBLEMA DE RESERVAS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela reservations
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS da tabela reservations
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reservations'
ORDER BY policyname;

-- 3. Verificar se RLS está habilitado na tabela reservations
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'reservations';

-- 4. Verificar dados existentes na tabela reservations
SELECT 
    COUNT(*) as total_reservations,
    COUNT(DISTINCT user_id) as usuarios_com_reservas,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'pago' THEN 1 END) as pagas,
    COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as canceladas
FROM reservations;

-- 5. Verificar se há reservas para o usuário atual
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    (SELECT COUNT(*) FROM reservations WHERE user_id = auth.uid()) as minhas_reservas;

-- 6. Testar consulta de reservas como usuário autenticado
SELECT 
    r.id,
    r.plan_type,
    r.passengers,
    r.total_amount,
    r.status,
    r.codigo_confirmacao,
    r.created_at,
    t.departure_date,
    t.return_date,
    d.name as destination_name,
    d.state as destination_state
FROM reservations r
LEFT JOIN trips t ON r.trip_id = t.id
LEFT JOIN destinations d ON t.destination_id = d.id
WHERE r.user_id = auth.uid()
ORDER BY r.created_at DESC
LIMIT 5;

-- 7. Verificar se há problemas com foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'reservations';

-- 8. Verificar se há dados nas tabelas relacionadas
SELECT 
    'trips' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN destination_id IS NOT NULL THEN 1 END) as com_destino
FROM trips
UNION ALL
SELECT 
    'destinations' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as com_nome
FROM destinations;
