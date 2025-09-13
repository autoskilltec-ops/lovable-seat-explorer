import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BusSeatMap from "../BusSeatMap";
import { Settings } from "lucide-react";

interface SeatReallocationProps {
  reservationId: string;
  tripId: string;
  currentSeatIds: string[];
  maxPassengers: number;
  onReallocationComplete: () => void;
}

export default function SeatReallocation({ 
  reservationId, 
  tripId, 
  currentSeatIds, 
  maxPassengers, 
  onReallocationComplete 
}: SeatReallocationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set(currentSeatIds));
  const [reservationSeats, setReservationSeats] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar assentos da reserva quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadReservationSeats();
    }
  }, [isOpen, reservationId]);

  // Carregar assentos já vinculados à reserva
  const loadReservationSeats = async () => {
    setLoading(true);
    try {
      // Buscar os assentos da reserva diretamente da tabela reservations
      const { data: reservation, error } = await supabase
        .from("reservations")
        .select("seat_ids")
        .eq("id", reservationId)
        .single();

      if (error) {
        console.error("Erro ao carregar assentos da reserva:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar assentos da reserva",
          variant: "destructive",
        });
        return;
      }

      const seatIds = reservation?.seat_ids || [];
      setReservationSeats(seatIds);
      setSelectedSeats(new Set(seatIds));
    } catch (error) {
      console.error("Erro ao carregar assentos da reserva:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar assentos da reserva",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para toggle de assentos (adicionar/remover)
  const toggleSeat = (seatId: string) => {
    setSelectedSeats(prev => {
      const newSelectedSeats = new Set(prev);
      
      if (newSelectedSeats.has(seatId)) {
        // Remover assento se já estiver selecionado
        newSelectedSeats.delete(seatId);
      } else {
        // Adicionar assento se não estiver selecionado
        // Verificar se não excede o limite
        if (newSelectedSeats.size >= maxPassengers) {
          toast({
            title: "Limite de Assentos",
            description: `Esta reserva possui ${maxPassengers} assento(s). Você deve manter a mesma quantidade ao realocar.`,
            variant: "destructive",
          });
          return prev;
        }
        newSelectedSeats.add(seatId);
      }
      
      return newSelectedSeats;
    });
  };

  // Handler para seleção de assentos do BusSeatMap
  const handleSeatSelection = (newSeatIds: string[]) => {
    // Converter array para Set para manter consistência
    const newSelectedSeats = new Set(newSeatIds);
    
    // Verificar se não excede o limite
    if (newSelectedSeats.size > maxPassengers) {
      toast({
        title: "Limite de Assentos",
        description: `Esta reserva possui ${maxPassengers} assento(s). Você deve manter a mesma quantidade ao realocar.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedSeats(newSelectedSeats);
  };

  const handleSaveReallocation = async () => {
    // Validar quantidade de assentos selecionados
    if (selectedSeats.size !== maxPassengers) {
      toast({
        title: "Quantidade Incorreta",
        description: `Você deve selecionar exatamente ${maxPassengers} assento(s) para manter a quantidade original da reserva. Atualmente selecionados: ${selectedSeats.size}`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const selectedSeatsArray = Array.from(selectedSeats);
      
      // Primeiro, liberar os assentos antigos
      if (reservationSeats.length > 0) {
        const { error: releaseError } = await supabase
          .from("bus_seats")
          .update({ 
            status: 'disponivel',
            reserved_until: null 
          })
          .in("id", reservationSeats);

        if (releaseError) {
          console.error("Erro ao liberar assentos antigos:", releaseError);
          throw releaseError;
        }
      }

      // Depois, ocupar os novos assentos
      if (selectedSeatsArray.length > 0) {
        const { error: occupyError } = await supabase
          .from("bus_seats")
          .update({ 
            status: 'ocupado',
            reserved_until: null 
          })
          .in("id", selectedSeatsArray);

        if (occupyError) {
          console.error("Erro ao ocupar novos assentos:", occupyError);
          throw occupyError;
        }
      }

      // Atualizar a reserva com os novos assentos
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ 
          seat_ids: selectedSeatsArray,
          updated_at: new Date().toISOString()
        })
        .eq("id", reservationId);

      if (reservationError) {
        console.error("Erro ao atualizar reserva:", reservationError);
        throw reservationError;
      }

      toast({
        title: "Sucesso",
        description: "Assentos realocados com sucesso",
      });

      setIsOpen(false);
      onReallocationComplete();
    } catch (error) {
      console.error("Erro ao realocar assentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao realocar assentos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="glass-surface border-glass-border/50 hover:glass-hover"
        >
          <Settings className="h-3 w-3 mr-1" />
          Gerenciar Assentos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Realocar Assentos da Reserva</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Carregando assentos da reserva...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                <strong>Realocação de Assentos:</strong> Esta reserva possui {maxPassengers} assento(s). 
                Você deve manter exatamente a mesma quantidade ao realocar. 
                Como administrador, você pode selecionar assentos de qualquer ônibus disponível.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Instruções:</strong> Desmarque os assentos atuais e selecione novos assentos. 
                  A quantidade deve permanecer sempre igual a {maxPassengers} assento(s).
                </p>
              </div>

              {/* Informações sobre assentos selecionados */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Assentos Selecionados:</strong> {selectedSeats.size} de {maxPassengers} assentos
                </p>
                {selectedSeats.size > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    IDs dos assentos: {Array.from(selectedSeats).join(", ")}
                  </p>
                )}
              </div>
              
              <BusSeatMap
                tripId={tripId}
                maxPassengers={maxPassengers}
                selectedSeats={Array.from(selectedSeats)}
                onSeatSelection={handleSeatSelection}
                isAdmin={true}
                isReallocation={true}
              />
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveReallocation}
                  disabled={saving || selectedSeats.size !== maxPassengers}
                >
                  {saving ? "Salvando..." : `Salvar Alterações (${selectedSeats.size}/${maxPassengers})`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}