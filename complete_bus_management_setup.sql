-- =====================================================
-- CONFIGURAÇÃO COMPLETA DO GERENCIAMENTO DE ÔNIBUS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Função para buscar dados dos ônibus relacionados às reservas
CREATE OR REPLACE FUNCTION get_reservation_bus_data(reservation_id UUID)
RETURNS TABLE (
  bus_id UUID,
  bus_number INTEGER,
  total_seats INTEGER,
  available_seats INTEGER,
  occupied_seats INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bus_id,
    b.bus_number,
    COUNT(bs.id)::INTEGER as total_seats,
    COUNT(CASE WHEN bs.status = 'disponivel' THEN 1 END)::INTEGER as available_seats,
    COUNT(CASE WHEN bs.status = 'ocupado' THEN 1 END)::INTEGER as occupied_seats
  FROM reservations r
  JOIN bus_seats bs ON bs.id = ANY(r.seat_ids)
  JOIN buses b ON bs.bus_id = b.id
  WHERE r.id = reservation_id
  GROUP BY b.id, b.bus_number
  ORDER BY b.bus_number
  LIMIT 1; -- Retorna apenas o primeiro ônibus encontrado (o da reserva)
END;
$$;

-- 2. Função para buscar dados de todos os ônibus de uma viagem (para admin)
CREATE OR REPLACE FUNCTION get_trip_buses_for_admin(trip_uuid UUID)
RETURNS TABLE (
  bus_id UUID,
  bus_number INTEGER,
  total_seats INTEGER,
  available_seats INTEGER,
  occupied_seats INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bus_id,
    b.bus_number,
    COUNT(bs.id)::INTEGER as total_seats,
    COUNT(CASE WHEN bs.status = 'disponivel' THEN 1 END)::INTEGER as available_seats,
    COUNT(CASE WHEN bs.status = 'ocupado' THEN 1 END)::INTEGER as occupied_seats
  FROM buses b
  LEFT JOIN bus_seats bs ON b.id = bs.bus_id
  WHERE b.trip_id = trip_uuid
  GROUP BY b.id, b.bus_number
  ORDER BY b.bus_number;
END;
$$;

-- 3. Função para otimizar busca de reservas com dados de ônibus
CREATE OR REPLACE FUNCTION get_reservations_with_bus_data()
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  passengers INTEGER,
  total_amount NUMERIC,
  status TEXT,
  plan_type TEXT,
  seat_ids TEXT[],
  codigo_confirmacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  trip_id UUID,
  departure_date DATE,
  return_date DATE,
  destination_name TEXT,
  destination_state TEXT,
  bus_id UUID,
  bus_number INTEGER,
  bus_total_seats INTEGER,
  bus_available_seats INTEGER,
  bus_occupied_seats INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.customer_name,
    r.customer_email,
    r.customer_phone,
    r.customer_cpf,
    r.passengers,
    r.total_amount,
    r.status::TEXT,
    r.plan_type,
    r.seat_ids,
    r.codigo_confirmacao,
    r.created_at,
    r.trip_id,
    t.departure_date,
    t.return_date,
    d.name as destination_name,
    d.state as destination_state,
    b.id as bus_id,
    b.bus_number,
    COUNT(bs.id)::INTEGER as bus_total_seats,
    COUNT(CASE WHEN bs.status = 'disponivel' THEN 1 END)::INTEGER as bus_available_seats,
    COUNT(CASE WHEN bs.status = 'ocupado' THEN 1 END)::INTEGER as bus_occupied_seats
  FROM reservations r
  JOIN trips t ON r.trip_id = t.id
  JOIN destinations d ON t.destination_id = d.id
  LEFT JOIN bus_seats bs ON bs.id = ANY(r.seat_ids)
  LEFT JOIN buses b ON bs.bus_id = b.id
  WHERE r.user_id IS NOT NULL -- Apenas reservas com user_id (excluindo reservas administrativas)
  GROUP BY r.id, b.id, b.bus_number, t.id, d.id
  ORDER BY r.created_at DESC;
END;
$$;

-- 4. Índices para otimizar performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_trip_id ON reservations(trip_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bus_seats_bus_id ON bus_seats(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_seats_trip_id ON bus_seats(trip_id);
CREATE INDEX IF NOT EXISTS idx_buses_trip_id ON buses(trip_id);
CREATE INDEX IF NOT EXISTS idx_bus_seats_status ON bus_seats(status);

-- 5. Política RLS para permitir que admins vejam todas as reservas
CREATE POLICY "Admins can view all reservations" 
ON reservations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'::user_role
  )
);

-- 6. Política RLS para permitir que usuários vejam apenas suas próprias reservas
CREATE POLICY "Users can view own reservations" 
ON reservations 
FOR SELECT 
USING (user_id = auth.uid());

-- 7. Política RLS para permitir que admins vejam dados de todos os ônibus
CREATE POLICY "Admins can view all bus data" 
ON buses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'::user_role
  )
);

-- 8. Política RLS para permitir que usuários vejam apenas ônibus de suas reservas
CREATE POLICY "Users can view buses from their reservations" 
ON buses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM reservations r
    JOIN bus_seats bs ON bs.id = ANY(r.seat_ids)
    WHERE r.user_id = auth.uid() AND bs.bus_id = buses.id
  )
);

-- 9. Função para limpar dados de teste (opcional - use com cuidado)
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Limpar reservas de teste (opcional)
  -- DELETE FROM reservations WHERE customer_name LIKE '%TEST%';
  
  -- Atualizar estatísticas das tabelas
  ANALYZE reservations;
  ANALYZE bus_seats;
  ANALYZE buses;
  
  RAISE NOTICE 'Limpeza de dados de teste concluída';
END;
$$;

-- 10. Comentários para documentação
COMMENT ON FUNCTION get_reservation_bus_data(UUID) IS 'Busca dados do ônibus relacionado a uma reserva específica';
COMMENT ON FUNCTION get_trip_buses_for_admin(UUID) IS 'Busca dados de todos os ônibus de uma viagem (apenas para admins)';
COMMENT ON FUNCTION get_reservations_with_bus_data() IS 'Busca reservas com dados de ônibus otimizados para performance';

-- =====================================================
-- VERIFICAÇÃO DE CONFIGURAÇÃO
-- =====================================================

-- Verificar se as funções foram criadas corretamente
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_reservation_bus_data', 'get_trip_buses_for_admin', 'get_reservations_with_bus_data')
ORDER BY routine_name;

-- Verificar índices criados
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('reservations', 'bus_seats', 'buses')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('reservations', 'buses')
ORDER BY tablename, policyname;

-- =====================================================
-- TESTE DAS FUNÇÕES (opcional)
-- =====================================================

-- Testar função de busca de dados de ônibus de reserva
-- (Substitua 'RESERVATION_ID_AQUI' por um ID de reserva real)
/*
SELECT * FROM get_reservation_bus_data('RESERVATION_ID_AQUI');
*/

-- Testar função de busca de reservas com dados de ônibus
-- (Limite a 5 resultados para teste)
/*
SELECT * FROM get_reservations_with_bus_data() LIMIT 5;
*/

-- =====================================================
-- CONFIGURAÇÃO CONCLUÍDA
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'CONFIGURAÇÃO DO GERENCIAMENTO DE ÔNIBUS CONCLUÍDA!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Funções criadas:';
  RAISE NOTICE '- get_reservation_bus_data()';
  RAISE NOTICE '- get_trip_buses_for_admin()';
  RAISE NOTICE '- get_reservations_with_bus_data()';
  RAISE NOTICE '';
  RAISE NOTICE 'Índices criados para otimização de performance';
  RAISE NOTICE 'Políticas RLS configuradas para segurança';
  RAISE NOTICE '';
  RAISE NOTICE 'O sistema está pronto para uso!';
  RAISE NOTICE '=====================================================';
END $$;
