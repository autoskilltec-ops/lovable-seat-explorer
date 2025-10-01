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
  status: 'disponivel' | 'ocupado' | 'reservado_temporario' | 'reservado';
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
  isAdmin?: boolean;
  isReallocation?: boolean; // New prop to indicate if this is for seat reallocation
  showOnlyReservationBus?: boolean; // New prop to show only the bus with the reservation
  reservationBusId?: string; // ID of the bus that contains the reservation
}

export default function BusSeatMap({ tripId, maxPassengers, selectedSeats, onSeatSelection, isAdmin = false, isReallocation = false, showOnlyReservationBus = false, reservationBusId }: BusSeatMapProps) {
  const [seats, setSeats] = useState<BusSeat[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      try {
        await fetchBusesAndData();
      } catch (error) {
        console.error("Error initializing bus data:", error);
      }
    };
    
    initializeData();
    
    // Clean expired holds every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        cleanExpiredHolds();
      }
    }, 30000);
    
    // Realtime: listen to seat updates for this trip and refresh UI
    const channel = supabase.channel(`bus_seats_trip_${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bus_seats',
        filter: `trip_id=eq.${tripId}`
      }, () => {
        if (isMounted) {
          fetchBusesAndData();
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(interval);
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error("Error removing channel:", error);
      }
    };
  }, [tripId]);

  // When bus selection changes, fetch seats for that bus
  useEffect(() => {
    if (selectedBusId) {
      // Clear current selections when switching buses to prevent DOM issues
      onSeatSelection([]);
      fetchSeatsForBus(selectedBusId);
    }
  }, [selectedBusId]);

  const fetchBusesAndData = async () => {
    setLoading(true);
    try {
      if (showOnlyReservationBus && reservationBusId) {
        // Se estamos mostrando apenas o ônibus da reserva, buscar apenas esse ônibus
        const { data: busData, error: busError } = await supabase
          .from('buses')
          .select(`
            id,
            bus_number,
            bus_seats!inner (
              id,
              seat_number,
              status,
              reserved_until
            )
          `)
          .eq('id', reservationBusId)
          .single();

        if (busError) throw busError;

        // Calcular estatísticas do ônibus
        const seats = busData.bus_seats || [];
        const totalSeats = seats.length;
        const availableSeats = seats.filter(s => s.status === 'disponivel').length;
        const occupiedSeats = seats.filter(s => s.status === 'ocupado' || s.status === 'reservado').length;

        const busInfo = {
          bus_id: busData.id,
          bus_number: busData.bus_number,
          total_seats: totalSeats,
          available_seats: availableSeats,
          occupied_seats: occupiedSeats
        };

        setBuses([busInfo]);
        setSelectedBusId(busData.id);
      } else {
        // Buscar todos os ônibus da viagem (comportamento normal)
        const { data: busData, error: busError } = await supabase
          .rpc('get_trip_buses', { trip_uuid: tripId });

        if (busError) throw busError;

        setBuses(busData || []);
        
        // Select first available bus by default if none selected and buses exist
        if (busData && busData.length > 0 && !selectedBusId) {
          const availableBus = getFirstAvailableBus(busData);
          setSelectedBusId(availableBus.bus_id);
        }
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

  // Get the first available bus based on priority rules
  const getFirstAvailableBus = (busData: Bus[]) => {
    if (isAdmin) {
      // Admins can select any bus
      return busData[0];
    }
    
    // For regular users, apply priority rules
    const sortedBuses = [...busData].sort((a, b) => a.bus_number - b.bus_number);
    
    for (const bus of sortedBuses) {
      if (bus.available_seats > 0) {
        return bus;
      }
    }
    
    // If no buses have available seats, return the first one
    return sortedBuses[0];
  };

  // Check if a bus can be selected based on priority rules
  const canSelectBus = (bus: Bus) => {
    if (isAdmin) {
      // Admins can select any bus
      return true;
    }
    
    const sortedBuses = [...buses].sort((a, b) => a.bus_number - b.bus_number);
    const busIndex = sortedBuses.findIndex(b => b.bus_id === bus.bus_id);
    
    // Bus 1 can always be selected if it has available seats
    if (busIndex === 0) {
      return bus.available_seats > 0;
    }
    
    // For subsequent buses, check if all previous buses are full
    for (let i = 0; i < busIndex; i++) {
      if (sortedBuses[i].available_seats > 0) {
        return false;
      }
    }
    
    return bus.available_seats > 0;
  };

  const handleSeatClick = async (seat: BusSeat) => {
    // Não permitir seleção de assentos ocupados ou reservados
    if (seat.status === 'ocupado' || seat.status === 'reservado') {
      toast({
        title: "Assento indisponível",
        description: seat.status === 'reservado' 
          ? "Este assento está reservado aguardando confirmação"
          : "Este assento já está ocupado",
        variant: "destructive"
      });
      return;
    }

    const isSelected = selectedSeats.includes(seat.id);
    let newSelectedSeats: string[];

    if (isSelected) {
      // Remove seat
      newSelectedSeats = selectedSeats.filter(id => id !== seat.id);
      
      // Update local state immediately for better UX
      setSeats(prevSeats => 
        prevSeats.map(s => 
          s.id === seat.id 
            ? { ...s, status: 'disponivel' as const, reserved_until: undefined }
            : s
        )
      );
      
      // Release temporary hold in background
      (async () => {
        try {
          await supabase
            .from("bus_seats")
            .update({ 
              status: 'disponivel',
              reserved_until: null 
            })
            .eq("id", seat.id);
          // Realtime update will handle UI refresh
        } catch (error) {
          console.error("Erro ao liberar assento:", error);
          // Revert local state on error
          setSeats(prevSeats => 
            prevSeats.map(s => 
              s.id === seat.id 
                ? { ...s, status: 'reservado_temporario' as const }
                : s
            )
          );
        }
      })();
    } else {
      // Add seat if not at max capacity
      if (selectedSeats.length >= maxPassengers) {
        const message = isReallocation 
          ? `Esta reserva possui ${maxPassengers} assento(s). Desmarque um assento atual antes de selecionar outro.`
          : `Você pode selecionar no máximo ${maxPassengers} assento(s)`;
        
        toast({
          title: "Limite atingido",
          description: message,
          variant: "destructive",
        });
        return;
      }

      newSelectedSeats = [...selectedSeats, seat.id];
      
      // Update local state immediately for better UX
      const reservedUntil = new Date();
      reservedUntil.setMinutes(reservedUntil.getMinutes() + 15);
      
      setSeats(prevSeats => 
        prevSeats.map(s => 
          s.id === seat.id 
            ? { ...s, status: 'reservado_temporario' as const, reserved_until: reservedUntil.toISOString() }
            : s
        )
      );
      
      // Hold seat temporarily in background
      (async () => {
        try {
          await supabase
            .from("bus_seats")
            .update({ 
              status: 'reservado_temporario',
              reserved_until: reservedUntil.toISOString()
            })
            .eq("id", seat.id);
          // Realtime update will handle UI refresh
        } catch (error) {
          console.error("Erro ao reservar assento:", error);
          // Revert local state on error
          setSeats(prevSeats => 
            prevSeats.map(s => 
              s.id === seat.id 
                ? { ...s, status: 'disponivel' as const, reserved_until: undefined }
                : s
            )
          );
        }
      })();
    }

    // Use setTimeout to prevent DOM manipulation issues
    setTimeout(() => {
      onSeatSelection(newSelectedSeats);
    }, 0);
  };

  const getSeatColor = (seat: BusSeat) => {
    if (selectedSeats.includes(seat.id)) {
      return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
    
    switch (seat.status) {
      case 'ocupado':
        return "bg-red-500/80 text-white cursor-not-allowed font-semibold";
      case 'reservado':
        return "bg-yellow-500/80 text-yellow-950 cursor-not-allowed font-semibold";
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
              .map(n => {
                const realSeat = seatByNumber.get(n);
                if (realSeat) return realSeat;
                // Create a virtual seat that won't cause DOM issues
                return { 
                  id: `virtual-${n}-${selectedBusId || 'default'}`, 
                  seat_number: n, 
                  status: 'disponivel' as const,
                  bus_id: selectedBusId 
                } as BusSeat;
              });
            const rightPair = rightPairNumbers
              .filter(n => n <= totalSeatsToShow)
              .map(n => {
                const realSeat = seatByNumber.get(n);
                if (realSeat) return realSeat;
                // Create a virtual seat that won't cause DOM issues
                return { 
                  id: `virtual-${n}-${selectedBusId || 'default'}`, 
                  seat_number: n, 
                  status: 'disponivel' as const,
                  bus_id: selectedBusId 
                } as BusSeat;
              });

            return (
              <div key={`row-${rowIndex}-${selectedBusId || 'default'}`} className="flex justify-between items-center gap-8">
                {/* Left side seats */}
                <div className="flex gap-1">
                  {leftPair.map(seat => (
                    <Button
                      key={`left-${seat.id}`}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 text-xs font-mono",
                        getSeatColor(seat)
                      )}
                      onClick={() => {
                        // Only handle clicks on real seats, not virtual ones
                        if (!seat.id.startsWith('virtual-')) {
                          handleSeatClick(seat);
                        }
                      }}
                      disabled={seat.status === 'ocupado' || seat.status === 'reservado' || (seat.status === 'reservado_temporario' && !selectedSeats.includes(seat.id)) || seat.id.startsWith('virtual-') || showOnlyReservationBus}
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
                      key={`right-${seat.id}`}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 text-xs font-mono",
                        getSeatColor(seat)
                      )}
                      onClick={() => {
                        // Only handle clicks on real seats, not virtual ones
                        if (!seat.id.startsWith('virtual-')) {
                          handleSeatClick(seat);
                        }
                      }}
                      disabled={seat.status === 'ocupado' || seat.status === 'reservado' || (seat.status === 'reservado_temporario' && !selectedSeats.includes(seat.id)) || seat.id.startsWith('virtual-') || showOnlyReservationBus}
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
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500/80 rounded"></div>
            <span>Reservado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500/80 rounded"></div>
            <span>Indisponível</span>
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
          {isReallocation 
            ? `Realocação de Assentos: Mantenha exatamente ${maxPassengers} assento(s)`
            : `Selecione ${maxPassengers} assento(s) para sua viagem`
          }
          {selectedSeats.length > 0 && (
            <span className="block mt-1 text-primary font-medium">
              {selectedSeats.length}/{maxPassengers} assento(s) selecionado(s)
              {isReallocation && selectedSeats.length !== maxPassengers && (
                <span className="text-destructive ml-2">
                  (Deve ser exatamente {maxPassengers})
                </span>
              )}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bus Selection */}
        {buses.length > 1 && !showOnlyReservationBus && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o Ônibus:</label>
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha um ônibus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => {
                  const canSelect = canSelectBus(bus);
                  return (
                    <SelectItem 
                      key={bus.bus_id} 
                      value={bus.bus_id}
                      disabled={!canSelect}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>Ônibus {bus.bus_number}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {bus.available_seats} disponíveis
                        </span>
                        {!canSelect && !isAdmin && (
                          <span className="text-xs text-destructive ml-2">
                            (Aguarde ônibus anterior encher)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                Os ônibus são liberados por ordem de prioridade conforme a lotação
              </p>
            )}
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
                  <h3 className="font-semibold mb-3">Ônibus {currentBus.bus_number}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">{currentBus.total_seats}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Disponíveis:</span>
                      <span className="font-medium text-green-600">{currentBus.available_seats}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Ocupados:</span>
                      <span className="font-medium text-destructive">{currentBus.occupied_seats}</span>
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