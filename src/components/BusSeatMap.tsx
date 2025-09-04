import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BusSeat {
  id: string;
  seat_number: number;
  status: 'disponivel' | 'ocupado' | 'reservado_temporario';
  reserved_until?: string;
}

interface BusSeatMapProps {
  tripId: string;
  maxPassengers: number;
  selectedSeats: string[];
  onSeatSelection: (seatIds: string[]) => void;
}

export default function BusSeatMap({ tripId, maxPassengers, selectedSeats, onSeatSelection }: BusSeatMapProps) {
  const [seats, setSeats] = useState<BusSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSeats();
    // Clean expired holds every 30 seconds
    const interval = setInterval(cleanExpiredHolds, 30000);
    return () => clearInterval(interval);
  }, [tripId]);

  const fetchSeats = async () => {
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
      fetchSeats(); // Refresh seats after cleaning
    } catch (error) {
      console.error("Erro ao limpar reservas expiradas:", error);
    }
  };

  const handleSeatClick = async (seat: BusSeat) => {
    // If this is a virtual seat (not yet in DB), create it first
    if (String(seat.id).startsWith("virtual-")) {
      try {
        const { data, error } = await supabase
          .from("bus_seats")
          .insert({ trip_id: tripId, seat_number: seat.seat_number, status: 'disponivel' })
          .select()
          .single();
        if (error) throw error;
        if (data) {
          await fetchSeats();
          // After creating, proceed as if the user clicked the real seat
          await handleSeatClick({
            id: data.id,
            seat_number: data.seat_number,
            status: data.status,
            reserved_until: data.reserved_until,
          });
        }
      } catch (error) {
        console.error("Erro ao criar assento:", error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o assento.",
          variant: "destructive",
        });
      }
      return;
    }

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
    fetchSeats(); // Refresh to show updated status
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
      <CardContent>
        {renderBusLayout()}
      </CardContent>
    </Card>
  );
}