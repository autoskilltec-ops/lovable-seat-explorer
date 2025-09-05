import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle,
  User,
  Phone,
  Mail,
  CreditCard
} from "lucide-react";
import BusSeatMap from "../BusSeatMap";

interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_cpf: string | null;
  passengers: number;
  total_amount: number;
  status: string;
  plan_type: string;
  seat_ids: string[] | null;
  codigo_confirmacao: string;
  created_at: string;
  trip: {
    id: string;
    departure_date: string;
    return_date: string;
    destination: {
      name: string;
      state: string;
    };
  };
}

const ReservationManagement = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as reservas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmReservation = async (reservationId: string) => {
    setConfirming(reservationId);
    try {
      // Atualizar status da reserva para "pago"
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'pago' })
        .eq('id', reservationId);

      if (reservationError) throw reservationError;

      // Buscar a reserva para pegar os seat_ids
      const reservation = reservations.find(r => r.id === reservationId);
      if (reservation?.seat_ids && reservation.seat_ids.length > 0) {
        // Atualizar status dos assentos para "ocupado"
        const { error: seatsError } = await supabase
          .from('bus_seats')
          .update({ status: 'ocupado' })
          .in('id', reservation.seat_ids);

        if (seatsError) throw seatsError;
      }

      toast({
        title: "Reserva confirmada!",
        description: "A reserva foi confirmada e os assentos foram marcados como ocupados",
      });

      fetchReservations();
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a reserva",
        variant: "destructive"
      });
    } finally {
      setConfirming(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pendente: { color: "warning", icon: Clock, label: "Pendente" },
      pago: { color: "success", icon: CheckCircle, label: "Confirmado" },
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const groupedReservations = reservations.reduce((acc, reservation) => {
    const destination = `${reservation.trip.destination.name} - ${reservation.trip.destination.state}`;
    if (!acc[destination]) {
      acc[destination] = [];
    }
    acc[destination].push(reservation);
    return acc;
  }, {} as Record<string, Reservation[]>);

  const pendingReservations = reservations.filter(r => r.status === 'pendente');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gradient">Gerenciamento de Reservas</h2>
        <div className="flex gap-4">
          <Badge variant="outline" className="glass-surface border-glass-border/50">
            Total: {reservations.length}
          </Badge>
          <Badge variant="outline" className="glass-surface border-glass-border/50">
            Pendentes: {pendingReservations.length}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="glass-surface border-glass-border/30">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="by-destination">Por Destino</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card className="glass-card p-6 border-0">
            <h3 className="text-xl font-bold text-gradient mb-4">Reservas Pendentes de Confirmação</h3>
            {pendingReservations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma reserva pendente no momento
              </p>
            ) : (
              <div className="space-y-4">
                {pendingReservations.map((reservation) => (
                  <div key={reservation.id} className="glass-surface p-4 rounded-lg border border-glass-border/30">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Informações da Reserva */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{reservation.customer_name}</span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {reservation.customer_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {reservation.customer_email}
                            </div>
                          )}
                          {reservation.customer_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {reservation.customer_phone}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {reservation.passengers} passageiro(s)
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3" />
                            {formatCurrency(reservation.total_amount)}
                          </div>
                        </div>
                      </div>

                      {/* Informações da Viagem */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-semibold">
                            {reservation.trip.destination.name} - {reservation.trip.destination.state}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Ida: {formatDate(reservation.trip.departure_date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Volta: {formatDate(reservation.trip.return_date)}
                          </div>
                          <div>
                            <span className="font-medium">Plano:</span> {reservation.plan_type}
                          </div>
                          <div>
                            <span className="font-medium">Código:</span> {reservation.codigo_confirmacao}
                          </div>
                        </div>
                      </div>

                      {/* Assentos e Ações */}
                      <div className="space-y-3">
                        {reservation.seat_ids && reservation.seat_ids.length > 0 && (
                          <div>
                            <p className="font-medium text-sm mb-2">Assentos Selecionados:</p>
                            <BusSeatMap 
                              tripId={reservation.trip.id} 
                              maxPassengers={reservation.seat_ids.length}
                              selectedSeats={reservation.seat_ids}
                              onSeatSelection={() => {}}
                            />
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          {getStatusBadge(reservation.status)}
                          <Button
                            size="sm"
                            onClick={() => confirmReservation(reservation.id)}
                            disabled={confirming === reservation.id}
                            className="glass-button border-0"
                          >
                            {confirming === reservation.id ? "Confirmando..." : "Confirmar Reserva"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="by-destination" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.keys(groupedReservations).map((destination) => (
              <Card
                key={destination}
                className={`glass-card p-4 border-0 cursor-pointer hover:glass-hover transition-all duration-200 ${
                  selectedDestination === destination ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedDestination(
                  selectedDestination === destination ? null : destination
                )}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{destination}</h3>
                    <p className="text-sm text-muted-foreground">
                      {groupedReservations[destination].length} reserva(s)
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {selectedDestination && (
            <Card className="glass-card p-6 border-0">
              <h3 className="text-xl font-bold text-gradient mb-4">
                Reservas para {selectedDestination}
              </h3>
              <div className="space-y-4">
                {groupedReservations[selectedDestination].map((reservation) => (
                  <div key={reservation.id} className="glass-surface p-4 rounded-lg border border-glass-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{reservation.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.passengers} passageiro(s) • {formatCurrency(reservation.total_amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(reservation.status)}
                        {reservation.status === 'pendente' && (
                          <Button
                            size="sm"
                            onClick={() => confirmReservation(reservation.id)}
                            disabled={confirming === reservation.id}
                            className="glass-button border-0"
                          >
                            {confirming === reservation.id ? "Confirmando..." : "Confirmar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card className="glass-card p-6 border-0">
            <h3 className="text-xl font-bold text-gradient mb-4">Todas as Reservas</h3>
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="glass-surface p-4 rounded-lg border border-glass-border/30">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div>
                      <p className="font-semibold">{reservation.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{reservation.codigo_confirmacao}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Destino</p>
                      <p className="font-semibold">
                        {reservation.trip.destination.name} - {reservation.trip.destination.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-semibold">{formatDate(reservation.trip.departure_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-semibold text-primary">{formatCurrency(reservation.total_amount)}</p>
                    </div>
                    <div>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <div className="flex gap-2">
                      {reservation.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => confirmReservation(reservation.id)}
                          disabled={confirming === reservation.id}
                          className="glass-button border-0 text-xs"
                        >
                          {confirming === reservation.id ? "Confirmando..." : "Confirmar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReservationManagement;