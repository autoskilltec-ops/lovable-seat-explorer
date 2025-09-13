-- CORREÇÃO ESPECÍFICA PARA PROBLEMA DE RESERVAS
-- Execute este script no SQL Editor do Supabase

-- 1. Remover todas as políticas existentes da tabela reservations
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;
DROP POLICY IF EXISTS "Verified admins can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Verified admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Cada usuário vê suas reservas" ON reservations;
DROP POLICY IF EXISTS "Cada usuário cria suas reservas" ON reservations;
DROP POLICY IF EXISTS "Cada usuário altera suas reservas" ON reservations;
DROP POLICY IF EXISTS "Admin pode ver todas reservas" ON reservations;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas limpas para reservations
CREATE POLICY "Users can view own reservations" 
ON reservations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations" 
ON reservations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" 
ON reservations FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Política de admin para reservations
CREATE POLICY "Admins can manage all reservations" 
ON reservations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'admin@example.com'
  )
);

-- 5. Verificar se a tabela reservations tem a estrutura correta
-- Adicionar colunas se não existirem
DO $$
BEGIN
    -- Verificar se a coluna trip_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'trip_id'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN trip_id UUID REFERENCES trips(id);
    END IF;
    
    -- Verificar se a coluna seat_ids existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'seat_ids'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN seat_ids UUID[];
    END IF;
    
    -- Verificar se a coluna plan_type existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN plan_type TEXT;
    END IF;
    
    -- Verificar se a coluna passengers existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'passengers'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN passengers INTEGER;
    END IF;
    
    -- Verificar se a coluna total_amount existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN total_amount DECIMAL(10,2);
    END IF;
    
    -- Verificar se a coluna status existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN status reservation_status DEFAULT 'pendente';
    END IF;
    
    -- Verificar se a coluna codigo_confirmacao existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'codigo_confirmacao'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN codigo_confirmacao TEXT UNIQUE;
    END IF;
    
    -- Verificar se a coluna customer_name existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN customer_name TEXT;
    END IF;
    
    -- Verificar se a coluna customer_phone existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE public.reservations 
        ADD COLUMN customer_phone TEXT;
    END IF;
END $$;

-- 6. Criar função para gerar código de confirmação se não existir
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- 7. Atualizar reservas existentes que não têm código de confirmação
UPDATE public.reservations 
SET codigo_confirmacao = generate_confirmation_code()
WHERE codigo_confirmacao IS NULL OR codigo_confirmacao = '';

-- 8. Verificar se há reservas de teste para o usuário atual
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    (SELECT COUNT(*) FROM reservations WHERE user_id = auth.uid()) as minhas_reservas;

-- 9. Criar uma reserva de teste se o usuário estiver logado e não tiver reservas
INSERT INTO public.reservations (
    user_id,
    trip_id,
    seat_ids,
    plan_type,
    passengers,
    total_amount,
    status,
    codigo_confirmacao,
    customer_name,
    customer_phone
)
SELECT 
    auth.uid(),
    (SELECT id FROM trips LIMIT 1),
    ARRAY[]::UUID[],
    'individual',
    1,
    980.00,
    'pendente',
    generate_confirmation_code(),
    (SELECT full_name FROM profiles WHERE user_id = auth.uid()),
    (SELECT phone FROM profiles WHERE user_id = auth.uid())
WHERE auth.uid() IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM reservations WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM trips LIMIT 1);

-- 10. Testar consulta de reservas
SELECT 
    r.id,
    r.plan_type,
    r.passengers,
    r.total_amount,
    r.status,
    r.codigo_confirmacao,
    r.created_at,
    t.departure_date,
    t.return_date,
    d.name as destination_name,
    d.state as destination_state
FROM reservations r
LEFT JOIN trips t ON r.trip_id = t.id
LEFT JOIN destinations d ON t.destination_id = d.id
WHERE r.user_id = auth.uid()
ORDER BY r.created_at DESC;

-- 11. Verificação final
SELECT 
    'Correção de reservas concluída!' as status,
    (SELECT COUNT(*) FROM reservations) as total_reservations,
    (SELECT COUNT(*) FROM reservations WHERE user_id = auth.uid()) as minhas_reservas;
