-- CORREÇÃO DA RECURSÃO INFINITA NA TABELA PROFILES
-- Execute este script no SQL Editor do Supabase

-- 1. Remover TODAS as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Verified admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Verified admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin pode ver todos os dados" ON profiles;
DROP POLICY IF EXISTS "Admin pode ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Cada usuário edita seu perfil" ON profiles;
DROP POLICY IF EXISTS "Cada usuário vê seu perfil" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas SIMPLES e NÃO-RECURSIVAS para profiles
-- Política para visualizar próprio perfil
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Política para atualizar próprio perfil
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para inserir próprio perfil
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Políticas de admin SEM recursão (usando verificação direta de email)
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- 5. Verificar se há políticas problemáticas restantes
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Verificar se há dados na tabela profiles
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as com_email
FROM profiles;

-- 7. Verificar se há usuários sem perfil
SELECT 
    u.id as user_id,
    u.email as user_email,
    u.created_at as user_created_at,
    p.id as profile_id,
    p.email as profile_email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 5;

-- 8. Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.profiles (user_id, email, full_name, phone, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(u.raw_user_meta_data ->> 'phone', ''),
    'user'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 9. Verificar se o trigger está funcionando corretamente
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'ensure_user_profile_trigger';

-- 10. Recriar o trigger se necessário
DROP TRIGGER IF EXISTS ensure_user_profile_trigger ON auth.users;

CREATE TRIGGER ensure_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- 11. Teste de consulta simples para verificar se não há recursão
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    (SELECT full_name FROM profiles WHERE user_id = auth.uid()) as current_user_name;

-- 12. Verificação final
SELECT 
    'Correção de recursão concluída!' as status,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.user_id WHERE p.id IS NULL) as users_without_profile;
