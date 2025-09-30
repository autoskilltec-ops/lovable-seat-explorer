-- Script para debug do fluxo de reservas
-- Execute no Supabase SQL Editor para verificar o estado atual

-- 1. Verificar políticas ativas na tabela reservations
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

-- 2. Verificar políticas ativas na tabela payments
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
WHERE tablename = 'payments'
ORDER BY policyname;

-- 3. Verificar triggers na tabela reservations
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'reservations'
ORDER BY trigger_name;

-- 4. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('reservations', 'payments', 'profiles')
ORDER BY tablename;

-- 5. Verificar função is_verified_admin
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'is_verified_admin';

-- 6. Testar função is_verified_admin com um usuário específico
-- (Substitua 'USER_ID_AQUI' pelo ID do usuário que você quer testar)
-- SELECT public.is_verified_admin('USER_ID_AQUI'::uuid);

-- 7. Verificar perfis de usuários
SELECT 
    user_id,
    email,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
