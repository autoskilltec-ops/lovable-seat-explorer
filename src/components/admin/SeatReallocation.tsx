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
  const [selectedSeats, setSelectedSeats] = useState<string[]>(currentSeatIds);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedSeats(currentSeatIds);
    }
  }, [isOpen, currentSeatIds]);

  // Custom seat selection handler that enforces the original quantity
  const handleSeatSelection = (newSeatIds: string[]) => {
    // If trying to select more than the original quantity, show error
    if (newSeatIds.length > maxPassengers) {
      toast({
        title: "Limite de Assentos",
        description: `Esta reserva possui ${maxPassengers} assento(s). Você deve manter a mesma quantidade ao realocar.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedSeats(newSeatIds);
  };

  const handleSaveReallocation = async () => {
    if (selectedSeats.length !== maxPassengers) {
      toast({
        title: "Quantidade Incorreta",
        description: `Você deve selecionar exatamente ${maxPassengers} assento(s) para manter a quantidade original da reserva`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // First, release the old seats
      if (currentSeatIds.length > 0) {
        await supabase
          .from("bus_seats")
          .update({ 
            status: 'disponivel',
            reserved_until: null 
          })
          .in("id", currentSeatIds);
      }

      // Then, occupy the new seats
      if (selectedSeats.length > 0) {
        await supabase
          .from("bus_seats")
          .update({ 
            status: 'ocupado',
            reserved_until: null 
          })
          .in("id", selectedSeats);
      }

      // Update the reservation
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ 
          seat_ids: selectedSeats,
          updated_at: new Date().toISOString()
        })
        .eq("id", reservationId);

      if (reservationError) throw reservationError;

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
        description: "Erro ao realocar assentos",
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
          
          <BusSeatMap
            tripId={tripId}
            maxPassengers={maxPassengers}
            selectedSeats={selectedSeats}
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
              disabled={saving || selectedSeats.length !== maxPassengers}
            >
              {saving ? "Salvando..." : `Salvar Alterações (${selectedSeats.length}/${maxPassengers})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}