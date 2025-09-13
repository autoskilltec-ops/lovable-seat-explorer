-- Teste para verificar se a separação de dados está funcionando
-- Execute este script no SQL Editor do Supabase para testar

-- 1. Verificar se a tabela customer_data foi criada
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer_data' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se as funções foram criadas
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'is_verified_admin', 'update_customer_data', 'get_customer_data')
ORDER BY routine_name;

-- 3. Verificar se as políticas RLS foram criadas
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
WHERE tablename = 'customer_data'
ORDER BY policyname;

-- 4. Testar a função is_verified_admin (substitua 'USER_ID_AQUI' pelo ID de um usuário admin)
-- SELECT public.is_verified_admin('USER_ID_AQUI'::uuid);

-- 5. Verificar se existem dados na tabela customer_data
SELECT COUNT(*) as total_customer_data FROM public.customer_data;

-- 6. Verificar se existem perfis com role admin
SELECT 
  user_id,
  email,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 7. Verificar se a constraint foi criada
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.customer_data'::regclass
AND conname = 'unique_customer_data_user_id';
