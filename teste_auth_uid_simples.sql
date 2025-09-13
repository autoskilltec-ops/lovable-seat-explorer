-- TESTE SIMPLES PARA VERIFICAR SE AUTH.UID() ESTÁ FUNCIONANDO
-- Execute este script no SQL Editor do Supabase

-- 1. Testar auth.uid() diretamente
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    now() as test_time;

-- 2. Verificar se há usuários logados
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
ORDER BY last_sign_in_at DESC 
LIMIT 5;

-- 3. Verificar sessões ativas
SELECT 
    user_id,
    created_at,
    updated_at,
    aal,
    not_after
FROM auth.sessions 
WHERE user_id IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Testar consulta simples com auth.uid()
SELECT 
    auth.uid() as current_user_id,
    (SELECT COUNT(*) FROM profiles WHERE user_id = auth.uid()) as profiles_count,
    (SELECT COUNT(*) FROM reservations WHERE user_id = auth.uid()) as reservations_count;

-- 5. Verificar políticas RLS ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'reservations')
ORDER BY tablename, policyname;

-- 6. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'reservations', 'destinations', 'trips')
ORDER BY tablename;

-- 7. Teste de inserção de perfil (se usuário estiver logado)
INSERT INTO public.profiles (user_id, email, full_name, phone, role)
SELECT 
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'Usuário Teste',
    '11999999999',
    'user'
WHERE auth.uid() IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid())
ON CONFLICT (user_id) DO NOTHING;

-- 8. Verificar se o perfil foi criado
SELECT 
    'Perfil criado para usuário logado' as status,
    (SELECT COUNT(*) FROM profiles WHERE user_id = auth.uid()) as profiles_count;

-- 9. Verificar dados nas tabelas
SELECT 'destinations' as tabela, COUNT(*) as total FROM destinations
UNION ALL
SELECT 'trips' as tabela, COUNT(*) as total FROM trips
UNION ALL
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'reservations' as tabela, COUNT(*) as total FROM reservations;
