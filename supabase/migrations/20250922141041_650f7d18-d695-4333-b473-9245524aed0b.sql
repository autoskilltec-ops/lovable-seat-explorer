-- Corrigir políticas RLS para garantir acesso aos dados
-- Primeiro, vamos garantir que as políticas existem e estão corretas

-- Limpar políticas conflitantes de destinations
DROP POLICY IF EXISTS "Public read access to destinations" ON destinations;
DROP POLICY IF EXISTS "Anyone can view destinations" ON destinations;

-- Criar política simples e clara para leitura pública
CREATE POLICY "Public can view destinations" 
ON destinations FOR SELECT 
USING (true);

-- Verificar se trips tem política de leitura pública
DROP POLICY IF EXISTS "Public can view trips" ON trips;
DROP POLICY IF EXISTS "Anyone can view trips" ON trips;

-- Criar política para trips
CREATE POLICY "Public can view trips" 
ON trips FOR SELECT 
USING (true);

-- Verificar se bus_seats tem política
DROP POLICY IF EXISTS "Public can view bus seats" ON bus_seats;
DROP POLICY IF EXISTS "Anyone can view bus seats" ON bus_seats;

-- Criar política para bus_seats
CREATE POLICY "Public can view bus seats" 
ON bus_seats FOR SELECT 
USING (true);

-- Verificar políticas criadas
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('destinations', 'trips', 'bus_seats') 
AND cmd = 'SELECT'
ORDER BY tablename;