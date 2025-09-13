-- TESTE PARA VERIFICAR SE AUTH.UID() ESTÁ FUNCIONANDO
-- Execute este script no SQL Editor do Supabase

-- 1. Criar função para testar auth.uid()
CREATE OR REPLACE FUNCTION test_auth_uid()
RETURNS TABLE (
    auth_uid_result UUID,
    auth_user_email TEXT,
    current_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as auth_uid_result,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as auth_user_email,
    now() as current_time;
END;
$$;

-- 2. Testar a função
SELECT * FROM test_auth_uid();

-- 3. Verificar se há usuários logados
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
ORDER BY last_sign_in_at DESC 
LIMIT 5;

-- 4. Verificar sessões ativas
SELECT 
    user_id,
    created_at,
    updated_at,
    factor_id,
    aal,
    not_after
FROM auth.sessions 
WHERE user_id IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Testar consulta simples com auth.uid()
SELECT 
    auth.uid() as current_user_id,
    (SELECT COUNT(*) FROM profiles WHERE user_id = auth.uid()) as profiles_count,
    (SELECT COUNT(*) FROM reservations WHERE user_id = auth.uid()) as reservations_count;

-- 6. Verificar políticas RLS ativas
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

-- 7. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'reservations', 'destinations', 'trips')
ORDER BY tablename;

-- 8. Teste de inserção de perfil (se usuário estiver logado)
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

-- 9. Verificar se o perfil foi criado
SELECT 
    'Perfil criado para usuário logado' as status,
    (SELECT COUNT(*) FROM profiles WHERE user_id = auth.uid()) as profiles_count;

-- 10. Limpar função de teste
DROP FUNCTION IF EXISTS test_auth_uid();
