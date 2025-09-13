-- Teste simples para verificar se a função is_verified_admin existe
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função existe
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_verified_admin';

-- 2. Se a função não existir, criar uma versão simples temporária
CREATE OR REPLACE FUNCTION public.is_verified_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id 
    AND p.role = 'admin'::user_role
  );
$$;

-- 3. Testar a função com um usuário existente
-- (Substitua 'USER_ID_AQUI' pelo ID de um usuário real)
-- SELECT public.is_verified_admin('USER_ID_AQUI'::uuid);
