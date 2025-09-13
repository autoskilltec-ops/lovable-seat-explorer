-- =====================================================
-- MIGRAÇÃO COMPLETA: SEPARAÇÃO DE DADOS DE CLIENTE E AUTENTICAÇÃO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. CRIAR TABELA CUSTOMER_DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customer_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  customer_cpf text,
  emergency_contact text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_customer_data_user_id ON public.customer_data(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_data_email ON public.customer_data(customer_email);

-- Habilitar RLS
ALTER TABLE public.customer_data ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS RLS PARA CUSTOMER_DATA
-- =====================================================
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own customer data"
ON public.customer_data
FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios dados
CREATE POLICY "Users can insert own customer data"
ON public.customer_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own customer data"
ON public.customer_data
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios dados
CREATE POLICY "Users can delete own customer data"
ON public.customer_data
FOR DELETE
USING (auth.uid() = user_id);

-- Admins podem ver todos os dados
CREATE POLICY "Admins can view all customer data"
ON public.customer_data
FOR SELECT
USING (public.is_verified_admin(auth.uid()));

-- Admins podem atualizar todos os dados
CREATE POLICY "Admins can update all customer data"
ON public.customer_data
FOR UPDATE
USING (public.is_verified_admin(auth.uid()))
WITH CHECK (public.is_verified_admin(auth.uid()));

-- Admins podem deletar todos os dados
CREATE POLICY "Admins can delete all customer data"
ON public.customer_data
FOR DELETE
USING (public.is_verified_admin(auth.uid()));

-- 3. ATUALIZAR FUNÇÕES DE ADMIN
-- =====================================================
-- Atualizar função is_admin para ser mais específica
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
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
    AND p.email IS NOT NULL
    AND p.email != ''
  );
$$;

-- Atualizar função is_verified_admin para ser mais rigorosa
CREATE OR REPLACE FUNCTION public.is_verified_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _verified boolean := false;
  _profile_exists boolean := false;
  _is_admin_role boolean := false;
BEGIN
  -- Verificar se o usuário tem email confirmado em auth.users
  SELECT COALESCE(u.email_confirmed_at IS NOT NULL, false)
  INTO _verified
  FROM auth.users u
  WHERE u.id = _user_id;

  -- Verificar se o perfil existe e tem role de admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id 
    AND p.role = 'admin'::user_role
    AND p.email IS NOT NULL
    AND p.email != ''
  ) INTO _is_admin_role;

  -- Retornar true apenas se o usuário for verificado E tiver role de admin
  RETURN _verified AND _is_admin_role;
END;
$fn$;

-- 4. CRIAR FUNÇÕES PARA CUSTOMER_DATA
-- =====================================================
-- Função para obter dados do cliente
CREATE OR REPLACE FUNCTION public.get_customer_data(_user_id uuid)
RETURNS TABLE (
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_cpf text,
  emergency_contact text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cd.customer_name,
    cd.customer_phone,
    cd.customer_email,
    cd.customer_cpf,
    cd.emergency_contact
  FROM public.customer_data cd
  WHERE cd.user_id = _user_id;
$$;

-- Função para atualizar dados do cliente
CREATE OR REPLACE FUNCTION public.update_customer_data(
  _user_id uuid,
  _customer_name text,
  _customer_phone text DEFAULT NULL,
  _customer_email text DEFAULT NULL,
  _customer_cpf text DEFAULT NULL,
  _emergency_contact text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() != _user_id AND NOT public.is_verified_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own customer data';
  END IF;

  -- Upsert dados do cliente
  INSERT INTO public.customer_data (
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    customer_cpf,
    emergency_contact
  ) VALUES (
    _user_id,
    _customer_name,
    _customer_phone,
    _customer_email,
    _customer_cpf,
    _emergency_contact
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    customer_email = EXCLUDED.customer_email,
    customer_cpf = EXCLUDED.customer_cpf,
    emergency_contact = EXCLUDED.emergency_contact,
    updated_at = now();
END;
$$;

-- 5. CRIAR TRIGGERS E CONSTRAINTS
-- =====================================================
-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_customer_data_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_data_updated_at
  BEFORE UPDATE ON public.customer_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_data_updated_at();

-- Constraint para garantir que admins tenham email válido
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS check_admin_email_not_empty;

ALTER TABLE public.profiles 
ADD CONSTRAINT check_admin_email_not_empty 
CHECK (
  (role = 'admin' AND email IS NOT NULL AND email != '' AND email ~ '^[^@]+@[^@]+\.[^@]+$') 
  OR (role != 'admin' OR role IS NULL)
);

-- Constraint único para user_id em customer_data
ALTER TABLE public.customer_data 
ADD CONSTRAINT unique_customer_data_user_id UNIQUE (user_id);

-- 6. CRIAR VIEW PARA ADMIN
-- =====================================================
-- View para fácil acesso aos dados do cliente com informações do usuário
CREATE OR REPLACE VIEW public.customer_data_with_user AS
SELECT 
  cd.*,
  p.email as auth_email,
  p.full_name as auth_name,
  p.phone as auth_phone,
  p.role as user_role
FROM public.customer_data cd
LEFT JOIN public.profiles p ON cd.user_id = p.user_id;

-- Conceder permissões apropriadas na view
GRANT SELECT ON public.customer_data_with_user TO authenticated;

-- 7. LIMPEZA E OTIMIZAÇÃO
-- =====================================================
-- Atualizar perfis existentes para garantir consistência
UPDATE public.profiles 
SET email = auth.users.email
FROM auth.users
WHERE profiles.user_id = auth.users.id 
AND profiles.email != auth.users.email
AND auth.users.email IS NOT NULL;

-- Remover roles de admin de perfis com emails inválidos
UPDATE public.profiles 
SET role = 'user'::user_role
WHERE role = 'admin'::user_role 
AND (
  email IS NULL 
  OR email = '' 
  OR email !~ '^[^@]+@[^@]+\.[^@]+$'
  OR NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = profiles.user_id 
    AND auth.users.email = profiles.email 
    AND auth.users.email_confirmed_at IS NOT NULL
  )
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role ON public.profiles(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON public.profiles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_customer_data_user_id_unique ON public.customer_data(user_id);

-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE public.customer_data IS 'Dados dos clientes separados dos perfis de autenticação para evitar conflitos com lógica de admin';
COMMENT ON TABLE public.profiles IS 'Perfis de autenticação - apenas gerenciamento de admin. Dados de cliente armazenados na tabela customer_data.';
COMMENT ON FUNCTION public.get_customer_data(uuid) IS 'Obter dados do cliente para um usuário específico - separado dos perfis de autenticação';
COMMENT ON FUNCTION public.update_customer_data(uuid, text, text, text, text, text) IS 'Atualizar dados do cliente para um usuário - separado dos perfis de autenticação';
COMMENT ON VIEW public.customer_data_with_user IS 'View combinando dados do cliente com informações do perfil de autenticação para fins administrativos';

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA COM SUCESSO!
-- =====================================================
-- Agora os dados dos clientes estão separados dos perfis de autenticação
-- A lógica de admin não será mais afetada pelos dados dos clientes
-- =====================================================
