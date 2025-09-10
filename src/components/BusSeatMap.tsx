import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BusSeat {
  id: string;
  seat_number: number;
  status: 'disponivel' | 'ocupado' | 'reservado_temporario';
  reserved_until?: string;
  bus_id?: string;
}

interface Bus {
  bus_id: string;
  bus_number: number;
  total_seats: number;
  available_seats: number;
  occupied_seats: number;
}

interface BusSeatMapProps {
  tripId: string;
  maxPassengers: number;
  selectedSeats: string[];
  onSeatSelection: (seatIds: string[]) => void;
}

export default function BusSeatMap({ tripId, maxPassengers, selectedSeats, onSeatSelection }: BusSeatMapProps) {
  const [seats, setSeats] = useState<BusSeat[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBusesAndData();
    // Clean expired holds every 30 seconds
    const interval = setInterval(cleanExpiredHolds, 30000);
    
    // Realtime: listen to seat updates for this trip and refresh UI
    const channel = supabase.channel(`bus_seats_trip_${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bus_seats',
        filter: `trip_id=eq.${tripId}`
      }, () => {
        fetchBusesAndData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  // When bus selection changes, fetch seats for that bus
  useEffect(() => {
    if (selectedBusId) {
      fetchSeatsForBus(selectedBusId);
    }
  }, [selectedBusId]);

  const fetchBusesAndData = async () => {
    try {
      // Fetch buses for this trip using the custom function
      const { data: busData, error: busError } = await supabase
        .rpc('get_trip_buses', { trip_uuid: tripId });

      if (busError) throw busError;

      setBuses(busData || []);
      
      // Select first bus by default if none selected and buses exist
      if (busData && busData.length > 0 && !selectedBusId) {
        setSelectedBusId(busData[0].bus_id);
      }
    } catch (error) {
      console.error("Error fetching buses:", error);
      // If the function doesn't exist (old trips), fall back to simple seat loading
      await fallbackFetchSeats();
    }
  };

  const fetchSeatsForBus = async (busId: string) => {
    if (!busId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bus_seats")
        .select("*")
        .eq("bus_id", busId)
        .order("seat_number");

      if (error) throw error;

      setSeats(data || []);
    } catch (error) {
      console.error("Error fetching seats for bus:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar assentos do ônibus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback for old trips without buses table
  const fallbackFetchSeats = async () => {
    try {
      const { data, error } = await supabase
        .from("bus_seats")
        .select("*")
        .eq("trip_id", tripId)
        .order("seat_number");

      if (error) throw error;

      // If no seats exist for this trip, create them
      if (!data || data.length === 0) {
        await createSeatsForTrip();
      } else if (data.length < 60) {
        // Ensure we always have 60 seats created
        await ensureSeatCount(data);
        const { data: refreshed } = await supabase
          .from("bus_seats")
          .select("*")
          .eq("trip_id", tripId)
          .order("seat_number");
        setSeats(refreshed || []);
      } else {
        setSeats(data);
      }
    } catch (error) {
      console.error("Erro ao carregar assentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar assentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSeatsForTrip = async () => {
    try {
      const seatsToCreate = Array.from({ length: 60 }, (_, i) => ({
        trip_id: tripId,
        seat_number: i + 1,
        status: 'disponivel' as const,
      }));

      const { data, error } = await supabase
        .from("bus_seats")
        .insert(seatsToCreate)
        .select();

      if (error) throw error;
      setSeats(data || []);
    } catch (error) {
      console.error("Erro ao criar assentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar assentos",
        variant: "destructive",
      });
    }
  };

  // Creates missing seats to reach 60 for an existing trip
  const ensureSeatCount = async (existingSeats: BusSeat[]) => {
    try {
      const existingNumbers = new Set(existingSeats.map(s => s.seat_number));
      const missingSeats = Array.from({ length: 60 }, (_, i) => i + 1)
        .filter(num => !existingNumbers.has(num))
        .map(num => ({
          trip_id: tripId,
          seat_number: num,
          status: 'disponivel' as const,
        }));

      if (missingSeats.length > 0) {
        await supabase.from("bus_seats").insert(missingSeats);
      }
    } catch (error) {
      console.error("Erro ao complementar assentos:", error);
    }
  };

  const cleanExpiredHolds = async () => {
    try {
      await supabase.rpc('clean_expired_seat_holds');
      // Refresh current bus data
      if (selectedBusId) {
        fetchSeatsForBus(selectedBusId);
      } else {
        fallbackFetchSeats();
      }
      fetchBusesAndData(); // Update bus occupancy stats
    } catch (error) {
      console.error("Erro ao limpar reservas expiradas:", error);
    }
  };

  const handleSeatClick = async (seat: BusSeat) => {
    if (seat.status === 'ocupado') return;

    const isSelected = selectedSeats.includes(seat.id);
    let newSelectedSeats: string[];

    if (isSelected) {
      // Remove seat
      newSelectedSeats = selectedSeats.filter(id => id !== seat.id);
      
      // Release temporary hold
      try {
        await supabase
          .from("bus_seats")
          .update({ 
            status: 'disponivel',
            reserved_until: null 
          })
          .eq("id", seat.id);
      } catch (error) {
        console.error("Erro ao liberar assento:", error);
      }
    } else {
      // Add seat if not at max capacity
      if (selectedSeats.length >= maxPassengers) {
        toast({
          title: "Limite atingido",
          description: `Você pode selecionar no máximo ${maxPassengers} assento(s)`,
          variant: "destructive",
        });
        return;
      }

      newSelectedSeats = [...selectedSeats, seat.id];
      
      // Hold seat temporarily for 15 minutes
      try {
        const reservedUntil = new Date();
        reservedUntil.setMinutes(reservedUntil.getMinutes() + 15);
        
        await supabase
          .from("bus_seats")
          .update({ 
            status: 'reservado_temporario',
            reserved_until: reservedUntil.toISOString()
          })
          .eq("id", seat.id);
      } catch (error) {
        console.error("Erro ao reservar assento:", error);
        return;
      }
    }

    onSeatSelection(newSelectedSeats);
    // Refresh seats to show updated status
    if (selectedBusId) {
      fetchSeatsForBus(selectedBusId);
    } else {
      fallbackFetchSeats();
    }
    // Update bus stats
    fetchBusesAndData();
  };

  const getSeatColor = (seat: BusSeat) => {
    if (selectedSeats.includes(seat.id)) {
      return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
    
    switch (seat.status) {
      case 'ocupado':
        return "bg-destructive text-destructive-foreground cursor-not-allowed";
      case 'reservado_temporario':
        return selectedSeats.includes(seat.id) 
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-muted text-muted-foreground cursor-not-allowed";
      default:
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer";
    }
  };

  const renderBusLayout = () => {
    // Always show 60 seats visually (15 rows of 4)
    const totalSeatsToShow = 60;
    const rows = Math.ceil(totalSeatsToShow / 4);
    const seatByNumber = new Map<number, BusSeat>();
    for (const s of seats) seatByNumber.set(s.seat_number, s);

    return (
      <div className="bg-card border rounded-lg p-4">
        {/* Driver area */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-8 bg-muted rounded flex items-center justify-center text-xs">
            Motorista
          </div>
        </div>

        {/* Seats layout */}
        <div className="space-y-2">
          {Array.from({ length: rows }, (_, rowIndex) => {
            const rowNumber = rowIndex + 1;
            const base = rowIndex * 4;
            const leftPairNumbers = [base + 1, base + 2];
            const rightPairNumbers = [base + 3, base + 4];
            const leftPair = leftPairNumbers
              .filter(n => n <= totalSeatsToShow)
              .map(n => seatByNumber.get(n) || ({ id: `virtual-${n}`, seat_number: n, status: 'disponivel' as const } as BusSeat));
            const rightPair = rightPairNumbers
              .filter(n => n <= totalSeatsToShow)
              .map(n => seatByNumber.get(n) || ({ id: `virtual-${n}`, seat_number: n, status: 'disponivel' as const } as BusSeat));

            return (
              <div key={rowIndex} className="flex justify-between items-center gap-8">
                {/* Left side seats */}
                <div className="flex gap-1">
                  {leftPair.map(seat => (
                    <Button
                      key={seat.id}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 text-xs font-mono",
                        getSeatColor(seat)
                      )}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'ocupado' || (seat.status === 'reservado_temporario' && !selectedSeats.includes(seat.id))}
                    >
                      {seat.seat_number}
                    </Button>
                  ))}
                </div>

                {/* Aisle */}
                <div className="flex-1 border-b border-dashed border-muted-foreground/20"></div>

                {/* Right side seats */}
                <div className="flex gap-1">
                  {rightPair.map(seat => (
                    <Button
                      key={seat.id}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 text-xs font-mono",
                        getSeatColor(seat)
                      )}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'ocupado' || (seat.status === 'reservado_temporario' && !selectedSeats.includes(seat.id))}
                    >
                      {seat.seat_number}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-4 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-secondary rounded"></div>
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded"></div>
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-muted rounded"></div>
            <span>Reservado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-destructive rounded"></div>
            <span>Ocupado</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seleção de Assentos</CardTitle>
          <CardDescription>Carregando assentos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-8 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleção de Assentos</CardTitle>
        <CardDescription>
          Selecione {maxPassengers} assento(s) para sua viagem
          {selectedSeats.length > 0 && (
            <span className="block mt-1 text-primary font-medium">
              {selectedSeats.length}/{maxPassengers} assento(s) selecionado(s)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bus Selection */}
        {buses.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o Ônibus:</label>
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha um ônibus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => (
                  <SelectItem key={bus.bus_id} value={bus.bus_id}>
                    Ônibus {bus.bus_number} - {bus.available_seats} assentos disponíveis
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bus Info */}
        {buses.length > 0 && selectedBusId && (
          <div className="glass-surface p-4 rounded-lg border border-glass-border/30">
            {(() => {
              const currentBus = buses.find(b => b.bus_id === selectedBusId);
              if (!currentBus) return null;
              
              return (
                <>
                  <h3 className="font-semibold mb-2">Ônibus {currentBus.bus_number}</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 font-medium">{currentBus.total_seats}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Disponíveis:</span>
                      <span className="ml-2 font-medium text-success">{currentBus.available_seats}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ocupados:</span>
                      <span className="ml-2 font-medium text-destructive">{currentBus.occupied_seats}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {renderBusLayout()}
      </CardContent>
    </Card>
  );
}