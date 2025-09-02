import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle 
} from "lucide-react";

const Admin = () => {
  // Mock data - será substituído por dados reais
  const stats = {
    totalReservas: 156,
    reservasPendentes: 23,
    receitaMes: 152450,
    ocupacaoMedia: 78
  };

  const reservasRecentes = [
    {
      id: "RES-156",
      cliente: "João Silva",
      destino: "Fortaleza - CE",
      data: "15/02/2024",
      valor: 980,
      status: "pendente"
    },
    {
      id: "RES-155", 
      cliente: "Maria Santos",
      destino: "Natal - RN",
      data: "22/02/2024",
      valor: 1840,
      status: "pago"
    },
    {
      id: "RES-154",
      cliente: "Pedro Costa",
      destino: "Fortaleza - CE", 
      data: "01/03/2024",
      valor: 3596,
      status: "pago"
    }
  ];

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
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
            Painel Administrativo
          </h1>
          <p className="text-xl text-muted-foreground">
            Gerencie reservas, destinos e monitore o desempenho do negócio
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                        <Button size="sm" variant="outline" className="glass-surface border-glass-border/50 hover:glass-hover text-xs">
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

        {/* Coming Soon Message */}
        <Card className="glass-card p-8 border-0 text-center mt-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gradient">
              Funcionalidades Administrativas
            </h3>
            <p className="text-lg text-muted-foreground">
              O painel completo de administração será implementado nas próximas etapas, 
              incluindo gestão de banco de dados, confirmação de reservas e relatórios detalhados.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;