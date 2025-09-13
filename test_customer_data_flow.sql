-- Teste completo do fluxo de dados de cliente
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função update_customer_data está funcionando
-- (Substitua 'USER_ID_AQUI' pelo ID de um usuário real)
/*
SELECT public.update_customer_data(
  'USER_ID_AQUI'::uuid,
  'João Silva',
  '85999999999',
  'joao@email.com',
  '12345678901',
  'Maria Silva - 85988888888'
);
*/

-- 2. Verificar se os dados foram salvos na tabela customer_data
SELECT 
  user_id,
  customer_name,
  customer_phone,
  customer_email,
  customer_cpf,
  emergency_contact,
  created_at
FROM public.customer_data
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar se os dados NÃO foram salvos na tabela profiles
-- (Os dados de cliente devem estar apenas em customer_data)
SELECT 
  user_id,
  email,
  full_name,
  phone,
  role
FROM public.profiles
WHERE email IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 4. Testar a função get_customer_data
-- (Substitua 'USER_ID_AQUI' pelo ID de um usuário real)
/*
SELECT * FROM public.get_customer_data('USER_ID_AQUI'::uuid);
*/

-- 5. Verificar se a função is_verified_admin está funcionando
-- (Substitua 'USER_ID_AQUI' pelo ID de um usuário admin)
/*
SELECT public.is_verified_admin('USER_ID_AQUI'::uuid);
*/

-- 6. Verificar se as políticas RLS estão funcionando
-- (Este comando deve retornar apenas os dados do usuário logado)
SELECT COUNT(*) as total_customer_data_records FROM public.customer_data;

-- 7. Verificar se a constraint unique está funcionando
-- (Tentar inserir dados duplicados deve falhar)
/*
INSERT INTO public.customer_data (user_id, customer_name) 
VALUES ('USER_ID_AQUI'::uuid, 'Teste Duplicado');
-- Deve retornar erro de constraint violation
*/

-- 8. Verificar se a view/função para admin está funcionando
-- (Apenas admins podem executar)
/*
SELECT * FROM public.get_all_customer_data();
*/
