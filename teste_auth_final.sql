-- TESTE FINAL PARA VERIFICAR AUTH.UID()
-- Execute este script no SQL Editor do Supabase

-- 1. Testar auth.uid() básico
SELECT 
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NULL - Usuário não logado'
        ELSE 'OK - Usuário logado'
    END as status;

-- 2. Verificar usuários no sistema
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '1 hour' THEN 1 END) as usuarios_ultima_hora
FROM auth.users;

-- 3. Verificar perfis
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id
FROM profiles;

-- 4. Verificar reservas
SELECT 
    COUNT(*) as total_reservations,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id
FROM reservations;

-- 5. Testar consulta que depende de auth.uid()
SELECT 
    'Teste de consulta com auth.uid()' as teste,
    COUNT(*) as resultado
FROM profiles 
WHERE user_id = auth.uid();

-- 6. Verificar políticas RLS
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'reservations')
ORDER BY tablename, policyname;

-- 7. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'reservations', 'destinations', 'trips')
ORDER BY tablename;
