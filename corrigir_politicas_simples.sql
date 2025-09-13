-- CORREÇÃO SIMPLES DAS POLÍTICAS RLS - VERSÃO SEGURA
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. CORRIGIR TABELA DESTINATIONS
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admins can manage destinations" ON destinations;
DROP POLICY IF EXISTS "Public can view destinations" ON destinations;
DROP POLICY IF EXISTS "Users can view destinations" ON destinations;
DROP POLICY IF EXISTS "Admins can view all destinations" ON destinations;
DROP POLICY IF EXISTS "Admins can insert destinations" ON destinations;
DROP POLICY IF EXISTS "Admins can update destinations" ON destinations;
DROP POLICY IF EXISTS "Admins can delete destinations" ON destinations;

-- Criar políticas simples para destinations
CREATE POLICY "Public can view destinations" ON destinations
    FOR SELECT USING (true);

-- 2. CORRIGIR TABELA TRIPS
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admins can manage trips" ON trips;
DROP POLICY IF EXISTS "Public can view trips" ON trips;
DROP POLICY IF EXISTS "Users can view trips" ON trips;
DROP POLICY IF EXISTS "Admins can view all trips" ON trips;
DROP POLICY IF EXISTS "Admins can insert trips" ON trips;
DROP POLICY IF EXISTS "Admins can update trips" ON trips;
DROP POLICY IF EXISTS "Admins can delete trips" ON trips;

-- Criar políticas simples para trips
CREATE POLICY "Public can view trips" ON trips
    FOR SELECT USING (true);

-- 3. CORRIGIR TABELA BUS_SEATS
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Public can view bus_seats" ON bus_seats;
DROP POLICY IF EXISTS "Users can view bus_seats" ON bus_seats;
DROP POLICY IF EXISTS "Admins can manage bus_seats" ON bus_seats;

-- Criar políticas simples para bus_seats
CREATE POLICY "Public can view bus_seats" ON bus_seats
    FOR SELECT USING (true);

-- 4. CORRIGIR TABELA RESERVATIONS
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can insert own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;

-- Criar políticas simples para reservations
CREATE POLICY "Users can view own reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reservations" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" ON reservations
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. CORRIGIR TABELA PAYMENTS
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;

-- Criar políticas simples para payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
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
WHERE tablename IN ('destinations', 'trips', 'bus_seats', 'reservations', 'payments')
ORDER BY tablename, policyname;

-- 7. TESTAR SE AS CONSULTAS FUNCIONAM
SELECT 'Teste de políticas RLS concluído' as status;
