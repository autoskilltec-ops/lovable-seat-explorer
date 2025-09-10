-- Criar 3 ônibus para cada trip
INSERT INTO buses (trip_id, bus_number)
SELECT t.id, bus_num
FROM trips t
CROSS JOIN generate_series(1, 3) as bus_num;

-- Atualizar os assentos existentes para pertencer ao primeiro ônibus de cada trip
UPDATE bus_seats 
SET bus_id = buses.id
FROM buses 
WHERE bus_seats.trip_id = buses.trip_id 
  AND buses.bus_number = 1
  AND bus_seats.bus_id IS NULL;

-- Criar assentos para o segundo ônibus (ônibus número 2)
INSERT INTO bus_seats (trip_id, bus_id, seat_number, status)
SELECT 
  buses.trip_id,
  buses.id as bus_id,
  generate_series(1, 60) as seat_number,
  'disponivel'::seat_status
FROM buses 
WHERE buses.bus_number = 2;

-- Criar assentos para o terceiro ônibus (ônibus número 3)
INSERT INTO bus_seats (trip_id, bus_id, seat_number, status)
SELECT 
  buses.trip_id,
  buses.id as bus_id,
  generate_series(1, 60) as seat_number,
  'disponivel'::seat_status
FROM buses 
WHERE buses.bus_number = 3;