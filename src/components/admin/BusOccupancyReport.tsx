import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BusOccupancy {
  bus_id: string;
  bus_number: number;
  total_seats: number;
  available_seats: number;
  occupied_seats: number;
}

interface BusOccupancyReportProps {
  tripId: string;
}

export default function BusOccupancyReport({ tripId }: BusOccupancyReportProps) {
  const [buses, setBuses] = useState<BusOccupancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusOccupancy();
  }, [tripId]);

  const fetchBusOccupancy = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_trip_buses', { trip_uuid: tripId });

      if (error) throw error;
      setBuses(data || []);
    } catch (error) {
      console.error("Error fetching bus occupancy:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando ocupação...</div>;
  }

  if (buses.length === 0) {
    return <div className="text-sm text-muted-foreground">Nenhum ônibus encontrado</div>;
  }

  return (
    <div className="space-y-2">
      {buses.map((bus) => (
        <Card key={bus.bus_id} className="p-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Ônibus {bus.bus_number}</h4>
              <p className="text-sm text-muted-foreground">
                {bus.occupied_seats}/{bus.total_seats} ocupados
              </p>
            </div>
            <Badge 
              variant={bus.available_seats > 20 ? "secondary" : bus.available_seats > 10 ? "outline" : "destructive"}
            >
              {Math.round((bus.occupied_seats / bus.total_seats) * 100)}% ocupação
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}