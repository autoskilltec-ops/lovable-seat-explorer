import { supabase } from "@/integrations/supabase/client";

export const populateTripsWithBuses = async () => {
  try {
    // Buscar todas as trips
    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("id, bus_quantity");

    if (tripsError) throw tripsError;

    // Buscar buses existentes
    const { data: existingBuses, error: busesError } = await supabase
      .from("buses" as any)
      .select("trip_id");

    if (busesError) {
      console.log("Buses table might not exist yet, proceeding...");
    }

    const tripIdsWithBuses = new Set((existingBuses as any)?.map((b: any) => b.trip_id) || []);
    const tripsNeedingBuses = (trips || []).filter(trip => !tripIdsWithBuses.has(trip.id));

    console.log(`Found ${tripsNeedingBuses.length} trips that need buses`);

    for (const trip of tripsNeedingBuses) {
      // Atualizar bus_quantity para 3
      await supabase
        .from("trips")
        .update({ bus_quantity: 3 })
        .eq("id", trip.id);

      // Criar 3 ônibus
      const busesToCreate = Array.from({ length: 3 }, (_, i) => ({
        trip_id: trip.id,
        bus_number: i + 1
      }));

      const { data: busesData, error: busCreateError } = await (supabase as any)
        .from("buses")
        .insert(busesToCreate)
        .select();

      if (busCreateError) {
        console.error(`Error creating buses for trip ${trip.id}:`, busCreateError);
        continue;
      }

      // Criar 60 assentos para cada ônibus
      const seatsToCreate = [];
      for (const bus of (busesData as any)) {
        for (let seatNum = 1; seatNum <= 60; seatNum++) {
          seatsToCreate.push({
            trip_id: trip.id,
            bus_id: bus.id,
            seat_number: seatNum,
            status: 'disponivel'
          });
        }
      }

      if (seatsToCreate.length > 0) {
        const { error: seatsError } = await supabase
          .from("bus_seats")
          .insert(seatsToCreate);

        if (seatsError) {
          console.error(`Error creating seats for trip ${trip.id}:`, seatsError);
        }
      }
    }

    return { success: true, processedTrips: tripsNeedingBuses.length };
  } catch (error) {
    console.error("Error populating trips with buses:", error);
    return { success: false, error };
  }
};