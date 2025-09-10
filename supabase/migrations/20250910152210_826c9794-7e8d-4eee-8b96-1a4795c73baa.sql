-- Atualizar todas as trips para ter bus_quantity = 3
UPDATE trips 
SET bus_quantity = 3 
WHERE bus_quantity IS NULL OR bus_quantity != 3;

-- Criar 3 ônibus para cada trip que não tem ônibus
WITH trips_without_buses AS (
  SELECT t.id
  FROM trips t
  LEFT JOIN buses b ON t.id = b.trip_id
  WHERE b.trip_id IS NULL
)
INSERT INTO buses (trip_id, bus_number)
SELECT 
  t.id as trip_id,
  generate_series(1, 3) as bus_number
FROM trips_without_buses t;

-- Criar 60 assentos para cada ônibus que não tem assentos
WITH buses_without_seats AS (
  SELECT b.id as bus_id, b.trip_id
  FROM buses b
  LEFT JOIN bus_seats bs ON b.id = bs.bus_id
  WHERE bs.bus_id IS NULL
)
INSERT INTO bus_seats (trip_id, bus_id, seat_number, status)
SELECT 
  b.trip_id,
  b.bus_id,
  generate_series(1, 60) as seat_number,
  'disponivel'::seat_status as status
FROM buses_without_seats b;