-- SCRIPT DE DIAGNÓSTICO PARA PROBLEMAS DE AUTENTICAÇÃO
-- Execute este script no SQL Editor do Supabase para verificar o estado atual

-- 1. Verificar se o trigger existe
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'ensure_user_profile_trigger';

-- 2. Verificar se a função existe
SELECT 
    routine_name, 
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'ensure_user_profile';

-- 3. Verificar estrutura da tabela profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 4. Verificar constraints da tabela profiles
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- 5. Verificar políticas RLS da tabela profiles
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
WHERE tablename = 'profiles';

-- 6. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 7. Verificar usuários existentes (últimos 5)
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Verificar perfis existentes (últimos 5)
SELECT 
    id,
    user_id,
    email,
    full_name,
    phone,
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. Verificar se há usuários sem perfil correspondente
SELECT 
    u.id as user_id,
    u.email as user_email,
    u.created_at as user_created_at,
    p.id as profile_id,
    p.email as profile_email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 10. Verificar configurações de autenticação
SELECT 
    key,
    value
FROM auth.config 
WHERE key IN ('DISABLE_SIGNUP', 'ENABLE_EMAIL_CONFIRMATIONS', 'ENABLE_PHONE_CONFIRMATIONS');
