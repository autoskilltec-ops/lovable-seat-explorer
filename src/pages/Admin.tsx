import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  ClipboardList
} from "lucide-react";
import ReservationManagement from "@/components/admin/ReservationManagement";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalReservas: 0,
    reservasPendentes: 0,
    receitaMes: 0,
    ocupacaoMedia: 0
  });
  const [reservasRecentes, setReservasRecentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Buscar todas as reservas de usuários (não administrativas)
      const { data: reservations, error: reservationsError } = await supabase
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
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false });

      if (reservationsError) throw reservationsError;

      // Calcular estatísticas
      const totalReservas = reservations?.length || 0;
      const reservasPendentes = reservations?.filter(r => r.status === 'pendente').length || 0;
      
      // Receita do mês atual (reservas pagas)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const receitaMes = reservations?.filter(r => {
        const reservationDate = new Date(r.created_at);
        return r.status === 'pago' && 
               reservationDate.getMonth() === currentMonth && 
               reservationDate.getFullYear() === currentYear;
      }).reduce((total, r) => total + parseFloat(r.total_amount.toString()), 0) || 0;

      // Ocupação média (simplificada - baseada em reservas confirmadas)
      const reservasConfirmadas = reservations?.filter(r => r.status === 'pago').length || 0;
      const ocupacaoMedia = totalReservas > 0 ? Math.round((reservasConfirmadas / totalReservas) * 100) : 0;

      setStats({
        totalReservas,
        reservasPendentes,
        receitaMes,
        ocupacaoMedia
      });

      // Formatar reservas recentes para exibição
      const recentReservations = reservations?.slice(0, 5).map(reservation => ({
        id: reservation.codigo_confirmacao,
        cliente: reservation.customer_name,
        destino: `${reservation.trip.destination.name} - ${reservation.trip.destination.state}`,
        data: new Date(reservation.trip.departure_date).toLocaleDateString('pt-BR'),
        valor: parseFloat(reservation.total_amount.toString()),
        status: reservation.status,
        reservationId: reservation.id
      })) || [];

      setReservasRecentes(recentReservations);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'pago' })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Reserva confirmada!",
        description: "A reserva foi confirmada com sucesso",
      });

      // Recarregar dados do dashboard
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a reserva",
        variant: "destructive"
      });
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

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
            Painel Administrativo
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Gerencie reservas, destinos e monitore o desempenho do negócio
          </p>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass-surface border-glass-border/30">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Reservas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-8 space-y-8">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">{/* ... keep existing code (stats cards) */}
          <Card className="glass-card p-6 border-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 glass-surface rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Reservas</p>
                <p className="text-2xl font-bold text-gradient">{stats.totalReservas}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 border-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 glass-surface rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-gradient">{stats.reservasPendentes}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 border-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 glass-surface rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita do Mês</p>
                <p className="text-2xl font-bold text-gradient">
                  {formatCurrency(stats.receitaMes)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 border-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 glass-surface rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ocupação Média</p>
                <p className="text-2xl font-bold text-gradient">{stats.ocupacaoMedia}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card p-6 border-0 hover:glass-hover transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 glass-surface rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gradient">Gerenciar Viagens</h3>
              <p className="text-muted-foreground">
                Criar novas datas, gerenciar ônibus e assentos
              </p>
              <Button className="w-full glass-button border-0">
                Acessar
              </Button>
            </div>
          </Card>

          <Card className="glass-card p-6 border-0 hover:glass-hover transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 glass-surface rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gradient">Destinos</h3>
              <p className="text-muted-foreground">
                Adicionar novos destinos e gerenciar informações
              </p>
              <Button className="w-full glass-button border-0">
                Acessar
              </Button>
            </div>
          </Card>

          <Card className="glass-card p-6 border-0 hover:glass-hover transition-all duration-300">
            <div className="space-y-4">
              <div className="w-12 h-12 glass-surface rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gradient">Configurações</h3>
              <p className="text-muted-foreground">
                Configurar preços, políticas e integrações
              </p>
              <Button className="w-full glass-button border-0">
                Acessar
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Reservations */}
        <Card className="glass-card p-6 border-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gradient">Reservas Recentes</h3>
              <Button className="glass-button border-0">
                Ver Todas
              </Button>
            </div>

            <div className="space-y-4">
              {reservasRecentes.map((reserva) => (
                <div 
                  key={reserva.id} 
                  className="glass-surface p-4 rounded-lg border border-glass-border/30 hover:glass-hover transition-all duration-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div>
                      <p className="font-semibold text-foreground">{reserva.id}</p>
                      <p className="text-sm text-muted-foreground">{reserva.cliente}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Destino</p>
                      <p className="font-semibold text-foreground">{reserva.destino}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-semibold text-foreground">{reserva.data}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-semibold text-primary">{formatCurrency(reserva.valor)}</p>
                    </div>
                    
                    <div>
                      {getStatusBadge(reserva.status)}
                    </div>
                    
                    <div className="flex gap-2">
                          <Button size="sm" className="glass-button border-0 text-xs">
                            Ver
                          </Button>
                          {reserva.status === "pendente" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="glass-surface border-glass-border/50 hover:glass-hover text-xs"
                              onClick={() => confirmReservation(reserva.reservationId)}
                            >
                              Confirmar
                            </Button>
                          )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

                </>
              )}
            </TabsContent>

            <TabsContent value="reservations" className="mt-8">
              <ReservationManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;