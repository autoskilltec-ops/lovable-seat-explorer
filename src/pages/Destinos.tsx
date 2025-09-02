import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Coffee, Bed, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import fortalezaImage from "@/assets/fortaleza-destination.jpg";
import natalImage from "@/assets/natal-destination.jpg";

const Destinos = () => {
  const destinos = [
    {
      id: 1,
      nome: "Fortaleza - CE",
      descricao: "Capital cearense famosa pelas praias urbanas, vida noturna agitada e rica cultura nordestina.",
      imagem: fortalezaImage,
      viagens: [
        {
          id: "trip-1",
          dataPartida: "15/02/2024",
          dataRetorno: "18/02/2024",
          precoIndividual: 980,
          vagas: 45,
          hospedagem: true,
          cafeManha: true
        },
        {
          id: "trip-2", 
          dataPartida: "01/03/2024",
          dataRetorno: "04/03/2024",
          precoIndividual: 980,
          vagas: 38,
          hospedagem: true,
          cafeManha: true
        }
      ]
    },
    {
      id: 2,
      nome: "Natal - RN",
      descricao: "Cidade das dunas com praias paradisíacas, águas cristalinas e aventuras emocionantes.",
      imagem: natalImage,
      viagens: [
        {
          id: "trip-3",
          dataPartida: "22/02/2024", 
          dataRetorno: "25/02/2024",
          precoIndividual: 1020,
          vagas: 52,
          hospedagem: true,
          cafeManha: true
        },
        {
          id: "trip-4",
          dataPartida: "08/03/2024",
          dataRetorno: "11/03/2024", 
          precoIndividual: 1020,
          vagas: 29,
          hospedagem: true,
          cafeManha: true
        }
      ]
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return date;
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
            Escolha Seu Destino
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubra os destinos mais incríveis do Nordeste brasileiro com pacotes completos 
            que incluem transporte, hospedagem e café da manhã.
          </p>
        </div>

        {/* Destinations */}
        <div className="space-y-12">
          {destinos.map((destino) => (
            <div key={destino.id} className="space-y-6">
              {/* Destination Header */}
              <Card className="glass-card p-8 border-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-6 w-6 text-primary" />
                      <h2 className="text-3xl font-bold text-gradient">
                        {destino.nome}
                      </h2>
                    </div>
                    <p className="text-lg text-muted-foreground">
                      {destino.descricao}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="glass-surface border-glass-border/50">
                        <Bed className="h-3 w-3 mr-1" />
                        Hospedagem Inclusa
                      </Badge>
                      <Badge className="glass-surface border-glass-border/50">
                        <Coffee className="h-3 w-3 mr-1" />
                        Café da Manhã
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="glass-surface rounded-xl h-64 overflow-hidden">
                    <img 
                      src={destino.imagem} 
                      alt={`Imagem de ${destino.nome}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </Card>

              {/* Available Trips */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Datas Disponíveis
                </h3>
                
                {destino.viagens.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {destino.viagens.map((viagem) => (
                      <Card key={viagem.id} className="glass-card p-6 border-0 hover:glass-hover transition-all duration-300 hover:scale-105">
                        <div className="space-y-4">
                          {/* Trip Dates */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-primary" />
                              <span className="font-semibold text-foreground">
                                {formatDate(viagem.dataPartida)}
                              </span>
                            </div>
                            <span className="text-muted-foreground">até</span>
                            <span className="font-semibold text-foreground">
                              {formatDate(viagem.dataRetorno)}
                            </span>
                          </div>

                          {/* Inclusions */}
                          <div className="flex flex-wrap gap-2">
                            {viagem.hospedagem && (
                              <Badge variant="secondary" className="glass-surface border-0">
                                <Bed className="h-3 w-3 mr-1" />
                                Hospedagem
                              </Badge>
                            )}
                            {viagem.cafeManha && (
                              <Badge variant="secondary" className="glass-surface border-0">
                                <Coffee className="h-3 w-3 mr-1" />
                                Café da Manhã
                              </Badge>
                            )}
                          </div>

                          {/* Availability */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {viagem.vagas} vagas disponíveis
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-success font-medium">
                                Disponível
                              </span>
                            </div>
                          </div>

                          {/* Price and Action */}
                          <div className="border-t border-glass-border/30 pt-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">A partir de</p>
                              <p className="text-2xl font-bold text-primary">
                                {formatPrice(viagem.precoIndividual)}
                              </p>
                            </div>
                            <Button 
                              asChild
                              className="glass-button border-0"
                            >
                              <Link to={`/reserva?trip_id=${viagem.id}`}>
                                Reservar
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="glass-card p-12 border-0 text-center">
                    <div className="space-y-4">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto" />
                      <h3 className="text-xl font-semibold text-muted-foreground">
                        Nenhuma data disponível
                      </h3>
                      <p className="text-muted-foreground">
                        Novas datas serão disponibilizadas em breve. 
                        Entre em contato conosco para mais informações.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="glass-card p-8 border-0 text-center mt-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gradient">
              Tem Dúvidas?
            </h2>
            <p className="text-lg text-muted-foreground">
              Nossa equipe está pronta para te ajudar a escolher a melhor opção.
            </p>
            <Button className="glass-button border-0">
              Falar com Atendimento
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Destinos;