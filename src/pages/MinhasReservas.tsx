import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const MinhasReservas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: reservas, isLoading, isError } = useQuery({
    queryKey: ['minhas-reservas', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as any[];
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          plan_type,
          passengers,
          total_amount,
          status,
          codigo_confirmacao,
          created_at,
          trip:trips (
            id,
            departure_date,
            return_date,
            destination:destinations (
              name,
              state
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const { data: selectedReservation, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['reserva-detalhes', selectedReservationId],
    queryFn: async () => {
      if (!selectedReservationId) return null as any;
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          plan_type,
          passengers,
          total_amount,
          status,
          codigo_confirmacao,
          created_at,
          customer_name,
          customer_email,
          customer_phone,
          customer_cpf,
          emergency_contact,
          seat_ids,
          trip:trips (
            id,
            departure_date,
            return_date,
            destination:destinations (
              name,
              state
            )
          )
        `)
        .eq('id', selectedReservationId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!selectedReservationId,
  });

  const { data: payments } = useQuery({
    queryKey: ['reserva-pagamentos', selectedReservationId],
    queryFn: async () => {
      if (!selectedReservationId) return [] as any[];
      const { data, error } = await supabase
        .from('payments')
        .select(`id, amount, method, status, created_at`)
        .eq('reservation_id', selectedReservationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedReservationId,
  });

  const { data: seatNumbers } = useQuery({
    queryKey: ['reserva-assentos', selectedReservationId, selectedReservation?.seat_ids?.join(',')],
    queryFn: async () => {
      if (!selectedReservationId) return [] as number[];
      if (!selectedReservation?.seat_ids || selectedReservation.seat_ids.length === 0) return [] as number[];

      // Tentar buscar por IDs na tabela bus_seats, retornando seat_number
      const { data, error } = await supabase
        .from('bus_seats')
        .select('seat_number, id')
        .in('id', selectedReservation.seat_ids as string[]);

      if (!error && data) {
        return data.map(s => Number(s.seat_number)).filter((n) => !Number.isNaN(n));
      }

      // Fallback: caso seat_ids já sejam números, apenas converte
      const numeric = (selectedReservation.seat_ids as string[])
        .map(v => Number(v))
        .filter(n => !Number.isNaN(n));
      return numeric;
    },
    enabled: !!selectedReservationId && Array.isArray(selectedReservation?.seat_ids),
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pendente: { color: "warning", icon: Clock, label: "Pendente" },
      pago: { color: "success", icon: CheckCircle, label: "Confirmado" },
      expirado: { color: "destructive", icon: XCircle, label: "Expirado" },
      cancelado: { color: "destructive", icon: XCircle, label: "Cancelado" }
    };

    const config = statusMap[status as keyof typeof statusMap];
    const Icon = config.icon;

    return (
      <Badge variant={config.color as any} className="glass-surface border-0">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
            Minhas Reservas
          </h1>
          <p className="text-xl text-muted-foreground">
            Acompanhe suas viagens e gerencie suas reservas
          </p>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <Card className="glass-card p-12 border-0 text-center">
            <div className="space-y-4">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-lg text-muted-foreground">Carregando suas reservas...</p>
            </div>
          </Card>
        )}

        {isError && (
          <Card className="glass-card p-12 border-0 text-center">
            <div className="space-y-4">
              <XCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-lg text-muted-foreground">Não foi possível carregar suas reservas.</p>
            </div>
          </Card>
        )}

        {/* Reservations List */}
        {!isLoading && !isError && reservas && reservas.length > 0 ? (
          <div className="space-y-6">
            {reservas.map((reserva: any) => (
              <Card key={reserva.id} className="glass-card p-6 border-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Trip Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold text-gradient">
                        {reserva.trip?.destination?.name} - {reserva.trip?.destination?.state}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{formatDate(reserva.trip?.departure_date)}</span>
                      </div>
                      <span className="text-muted-foreground">até</span>
                      <span className="font-semibold">{formatDate(reserva.trip?.return_date)}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Passageiros {reserva.passengers}
                      </div>
                      <div>Plano {reserva.plan_type}</div>
                    </div>
                  </div>

                  {/* Status & Price */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Status</p>
                      {getStatusBadge(reserva.status)}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(Number(reserva.total_amount))}
                      </p>
                    </div>

                    {reserva.codigo_confirmacao && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Código de Confirmação</p>
                        <p className="font-mono font-semibold text-foreground">
                          {reserva.codigo_confirmacao}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button className="w-full glass-button border-0" onClick={() => { setSelectedReservationId(reserva.id); setDetailsOpen(true); }}>
                      Ver Detalhes
                    </Button>
                    
                    {reserva.status === "pago" && (
                      <>
                        <Button 
                          variant="outline" 
                          className="w-full glass-surface border-glass-border/50 hover:glass-hover"
                        >
                          Enviar para WhatsApp
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full glass-surface border-glass-border/50 hover:glass-hover text-destructive"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('reservations')
                                .update({ status: 'cancelado' })
                                .eq('id', reserva.id);
                              
                              if (error) throw error;
                              
                              toast({ 
                                title: 'Reserva cancelada com sucesso', 
                                description: '✅ Reserva cancelada com sucesso.' 
                              });
                              queryClient.invalidateQueries({ queryKey: ['minhas-reservas', user?.id] });
                            } catch (error) {
                              console.error('Erro ao cancelar reserva:', error);
                              toast({ 
                                title: 'Erro', 
                                description: '❌ Não foi possível cancelar a reserva, tente novamente.', 
                                variant: 'destructive' 
                              });
                            }
                          }}
                        >
                          Cancelar Reserva
                        </Button>
                      </>
                    )}
                    
                    {reserva.status === "pendente" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          className="w-full glass-surface border-glass-border/50 hover:glass-hover"
                        >
                          Finalizar Pagamento
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full glass-surface border-glass-border/50 hover:glass-hover text-destructive"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('reservations')
                                .update({ status: 'cancelado' })
                                .eq('id', reserva.id);
                              
                              if (error) throw error;
                              
                              toast({ 
                                title: 'Reserva cancelada com sucesso', 
                                description: '✅ Reserva cancelada com sucesso.' 
                              });
                              queryClient.invalidateQueries({ queryKey: ['minhas-reservas', user?.id] });
                            } catch (error) {
                              console.error('Erro ao cancelar reserva:', error);
                              toast({ 
                                title: 'Erro', 
                                description: '❌ Não foi possível cancelar a reserva, tente novamente.', 
                                variant: 'destructive' 
                              });
                            }
                          }}
                        >
                          Cancelar Reserva
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card p-12 border-0 text-center">
            <div className="space-y-6">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-2xl font-bold text-gradient">
                Nenhuma reserva encontrada
              </h3>
              <p className="text-lg text-muted-foreground">
                Você ainda não possui reservas. Que tal explorar nossos destinos?
              </p>
              <Button className="glass-button border-0">
                Ver Destinos
              </Button>
            </div>
          </Card>
        )}

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Reserva</DialogTitle>
            </DialogHeader>
            {isLoadingDetails ? (
              <div className="py-6 text-center text-muted-foreground">Carregando...</div>
            ) : selectedReservation ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Viagem</h3>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>{selectedReservation.trip?.destination?.name} - {selectedReservation.trip?.destination?.state}</div>
                    <div>Saída: {formatDate(selectedReservation.trip?.departure_date)} — Retorno: {formatDate(selectedReservation.trip?.return_date)}</div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Reserva</h3>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <div>Código: <span className="font-mono text-foreground">{selectedReservation.codigo_confirmacao}</span></div>
                      <div>Status: <span className="text-foreground capitalize">{selectedReservation.status}</span></div>
                      <div>Plano: <span className="text-foreground">{selectedReservation.plan_type}</span></div>
                      <div>Passageiros: <span className="text-foreground">{selectedReservation.passengers}</span></div>
                      <div>Valor Total: <span className="text-foreground">{formatPrice(Number(selectedReservation.total_amount))}</span></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">Passageiro</h3>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <div>Nome: <span className="text-foreground">{selectedReservation.customer_name}</span></div>
                      {selectedReservation.customer_cpf && (<div>CPF: <span className="text-foreground">{selectedReservation.customer_cpf}</span></div>)}
                      {selectedReservation.customer_email && (<div>Email: <span className="text-foreground">{selectedReservation.customer_email}</span></div>)}
                      {selectedReservation.customer_phone && (<div>Telefone: <span className="text-foreground">{selectedReservation.customer_phone}</span></div>)}
                      {selectedReservation.emergency_contact && (<div>Contato de Emergência: <span className="text-foreground">{selectedReservation.emergency_contact}</span></div>)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold">Assentos Selecionados</h3>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {seatNumbers && seatNumbers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {seatNumbers.map((seat: number, idx: number) => (
                          <span key={idx} className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">{seat}</span>
                        ))}
                      </div>
                    ) : Array.isArray(selectedReservation?.seat_ids) && selectedReservation?.seat_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedReservation?.seat_ids.map((seat: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">{seat}</span>
                        ))}
                      </div>
                    ) : (
                      <span>Nenhum assento especificado</span>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold">Pagamentos</h3>
                  <div className="mt-2 text-sm text-muted-foreground space-y-2">
                    {payments && payments.length > 0 ? (
                      payments.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between rounded-md border border-glass-border/50 px-3 py-2">
                          <div>
                            <div className="text-foreground">{formatPrice(Number(p.amount))}</div>
                            <div className="text-xs">{new Date(p.created_at).toLocaleString('pt-BR')} • {p.method}</div>
                          </div>
                          <div className="text-xs capitalize">{p.status}</div>
                        </div>
                      ))
                    ) : (
                      <div>Nenhum pagamento registrado</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">Reserva não encontrada.</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Help Section */}
        <Card className="glass-card p-8 border-0 text-center mt-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gradient">
              Precisa de Ajuda?
            </h3>
            <p className="text-lg text-muted-foreground">
              Nossa equipe de suporte está sempre disponível para te ajudar.
            </p>
            <Button className="glass-button border-0">
              Falar com Suporte
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MinhasReservas;