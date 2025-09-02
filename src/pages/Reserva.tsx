import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Users, Coffee, Bed } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const Reserva = () => {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('trip_id');

  // Mock data baseado no trip_id - será substituído por dados reais
  const tripData = {
    "trip-1": {
      destino: "Fortaleza - CE",
      dataPartida: "15/02/2024",
      dataRetorno: "18/02/2024",
      hospedagem: true,
      cafeManha: true
    },
    "trip-2": {
      destino: "Fortaleza - CE", 
      dataPartida: "01/03/2024",
      dataRetorno: "04/03/2024",
      hospedagem: true,
      cafeManha: true
    },
    "trip-3": {
      destino: "Natal - RN",
      dataPartida: "22/02/2024",
      dataRetorno: "25/02/2024", 
      hospedagem: true,
      cafeManha: true
    },
    "trip-4": {
      destino: "Natal - RN",
      dataPartida: "08/03/2024",
      dataRetorno: "11/03/2024",
      hospedagem: true,
      cafeManha: true
    }
  };

  const trip = tripData[tripId as keyof typeof tripData];

  if (!trip) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="glass-card p-12 border-0 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gradient">
              Viagem não encontrada
            </h1>
            <p className="text-muted-foreground">
              A viagem que você está procurando não foi encontrada.
            </p>
            <Button asChild className="glass-button border-0">
              <Link to="/destinos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Destinos
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost" 
            asChild
            className="glass-surface border-0 hover:glass-hover mb-6"
          >
            <Link to="/destinos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Destinos
            </Link>
          </Button>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Reservar Viagem
          </h1>
          <p className="text-xl text-muted-foreground">
            Escolha seus assentos e finalize sua reserva
          </p>
        </div>

        {/* Trip Summary */}
        <Card className="glass-card p-6 border-0 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-gradient">
                  {trip.destino}
                </h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{trip.dataPartida}</span>
                </div>
                <span className="text-muted-foreground">até</span>
                <span className="font-semibold">{trip.dataRetorno}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {trip.hospedagem && (
                  <Badge className="glass-surface border-glass-border/50">
                    <Bed className="h-3 w-3 mr-1" />
                    Hospedagem Inclusa
                  </Badge>
                )}
                {trip.cafeManha && (
                  <Badge className="glass-surface border-glass-border/50">
                    <Coffee className="h-3 w-3 mr-1" />
                    Café da Manhã
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                O que está incluído:
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Transporte ida e volta em ônibus executivo
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Hospedagem em hotel de qualidade
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Café da manhã todos os dias
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Acompanhamento de guia especializado
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Seat Selection Placeholder */}
        <Card className="glass-card p-8 border-0 mb-8">
          <div className="text-center space-y-6">
            <Users className="h-16 w-16 text-primary mx-auto" />
            <h3 className="text-2xl font-bold text-gradient">
              Seleção de Assentos
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O mapa de assentos interativo será implementado na próxima etapa. 
              Por enquanto, você pode continuar para ver os planos disponíveis.
            </p>
          </div>
        </Card>

        {/* Plans Section Placeholder */}
        <Card className="glass-card p-8 border-0">
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-bold text-gradient">
              Escolha Seu Plano
            </h3>
            <p className="text-lg text-muted-foreground">
              Diferentes opções de preço para sua viagem
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                {
                  name: "Individual",
                  price: 980,
                  description: "Perfeito para viajantes solo",
                  passengers: 1
                },
                {
                  name: "Casal", 
                  price: 1840,
                  pricePerPerson: 920,
                  description: "Ideal para casais",
                  passengers: 2
                },
                {
                  name: "Grupo (4 pessoas)",
                  price: 3596,
                  pricePerPerson: 899,
                  description: "Melhor preço por pessoa",
                  passengers: 4
                }
              ].map((plan, index) => (
                <Card key={index} className="glass-surface p-6 border-glass-border/30 hover:glass-hover transition-all duration-300">
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-gradient">
                      {plan.name}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {plan.description}
                    </p>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        R$ {plan.price.toLocaleString('pt-BR')}
                      </div>
                      {plan.pricePerPerson && (
                        <div className="text-sm text-muted-foreground">
                          R$ {plan.pricePerPerson.toLocaleString('pt-BR')} por pessoa
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {plan.passengers} passageiro{plan.passengers > 1 ? 's' : ''}
                    </div>
                    <Button className="w-full glass-button border-0">
                      Selecionar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reserva;