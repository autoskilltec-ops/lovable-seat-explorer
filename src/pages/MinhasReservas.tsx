import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle } from "lucide-react";

const MinhasReservas = () => {
  // Mock data - será substituído por dados reais
  const reservas = [
    {
      id: "RES-001",
      destino: "Fortaleza - CE",
      dataPartida: "15/02/2024",
      dataRetorno: "18/02/2024", 
      onibus: 1,
      assento: 15,
      plano: "Individual",
      preco: 980,
      status: "pago",
      codigoConfirmacao: "FTL2024001"
    }
  ];

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

        {/* Reservations List */}
        {reservas.length > 0 ? (
          <div className="space-y-6">
            {reservas.map((reserva) => (
              <Card key={reserva.id} className="glass-card p-6 border-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Trip Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold text-gradient">
                        {reserva.destino}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{reserva.dataPartida}</span>
                      </div>
                      <span className="text-muted-foreground">até</span>
                      <span className="font-semibold">{reserva.dataRetorno}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Ônibus {reserva.onibus}
                      </div>
                      <div>Assento {reserva.assento}</div>
                      <div>{reserva.plano}</div>
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
                        {formatPrice(reserva.preco)}
                      </p>
                    </div>

                    {reserva.codigoConfirmacao && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Código de Confirmação</p>
                        <p className="font-mono font-semibold text-foreground">
                          {reserva.codigoConfirmacao}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button className="w-full glass-button border-0">
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
                        >
                          Cancelar Reserva
                        </Button>
                      </>
                    )}
                    
                    {reserva.status === "pendente" && (
                      <Button 
                        variant="outline" 
                        className="w-full glass-surface border-glass-border/50 hover:glass-hover"
                      >
                        Finalizar Pagamento
                      </Button>
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