-- Corrigir assentos dos ônibus para garantir 60 assentos por ônibus
-- Primeiro, verificar quantos assentos cada ônibus tem
DO $$
DECLARE
    bus_record RECORD;
    seat_count INTEGER;
    max_seat INTEGER;
    missing_seats INTEGER;
    seat_num INTEGER;
BEGIN
    -- Iterar por todos os ônibus
    FOR bus_record IN 
        SELECT b.id as bus_id, b.bus_number, b.trip_id
        FROM buses b
    LOOP
        -- Contar assentos existentes para este ônibus
        SELECT COUNT(*) INTO seat_count
        FROM bus_seats 
        WHERE bus_id = bus_record.bus_id;
        
        -- Encontrar o maior número de assento
        SELECT COALESCE(MAX(seat_number), 0) INTO max_seat
        FROM bus_seats 
        WHERE bus_id = bus_record.bus_id;
        
        RAISE NOTICE 'Ônibus %: % assentos existentes, maior assento: %', 
            bus_record.bus_number, seat_count, max_seat;
        
        -- Se tem menos de 60 assentos, criar os faltantes
        IF seat_count < 60 THEN
            missing_seats := 60 - seat_count;
            RAISE NOTICE 'Criando % assentos faltantes para ônibus %', 
                missing_seats, bus_record.bus_number;
            
            -- Criar assentos de (max_seat + 1) até 60
            FOR seat_num IN (max_seat + 1)..60 LOOP
                INSERT INTO bus_seats (trip_id, bus_id, seat_number, status)
                VALUES (bus_record.trip_id, bus_record.bus_id, seat_num, 'disponivel');
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Correção de assentos concluída!';
END $$;

-- Verificar se todos os ônibus agora têm 60 assentos
SELECT 
    b.bus_number,
    b.trip_id,
    COUNT(bs.id) as total_seats,
    COUNT(CASE WHEN bs.status = 'disponivel' THEN 1 END) as available_seats,
    COUNT(CASE WHEN bs.status = 'ocupado' THEN 1 END) as occupied_seats
FROM buses b
LEFT JOIN bus_seats bs ON b.id = bs.bus_id
GROUP BY b.id, b.bus_number, b.trip_id
ORDER BY b.trip_id, b.bus_number;