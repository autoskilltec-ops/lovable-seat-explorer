import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-beach.jpg";

const Home = () => {
  const features = [
    {
      icon: MapPin,
      title: "Destinos Incríveis",
      description: "Conheça as praias mais belas do Nordeste brasileiro"
    },
    {
      icon: Calendar,
      title: "Planejamento Completo",
      description: "Viagens organizadas com hospedagem e alimentação inclusos"
    },
    {
      icon: Users,
      title: "Grupos ou Individual",
      description: "Opções para viajantes solo, casais ou grupos de amigos"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Transporte seguro e acompanhamento profissional"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background/90"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gradient animate-float">
              Sua Próxima
              <br />
              Aventura Começa Aqui
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Descubra os destinos mais incríveis do Nordeste com todo o conforto, 
              segurança e diversão que você merece.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg"
                className="glass-button text-lg px-8 py-6 border-0"
              >
                <Link to="/destinos">
                  <MapPin className="mr-2 h-5 w-5" />
                  Ver Destinos
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="glass-surface border-glass-border/50 hover:glass-hover text-lg px-8 py-6"
                asChild
              >
                <Link to="/minhas-reservas">
                  <Calendar className="mr-2 h-5 w-5" />
                  Minhas Reservas
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-6">
              Por Que Escolher a DOMERYS?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mais de 10 anos criando experiências inesquecíveis com segurança, 
              conforto e os melhores preços do mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card p-6 border-0 hover:glass-hover transition-all duration-300 hover:scale-105">
                <div className="space-y-4">
                  <div className="w-12 h-12 glass-surface rounded-xl flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-6">
              Destinos Populares
            </h2>
            <p className="text-xl text-muted-foreground">
              Os destinos mais procurados pelos nossos viajantes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Fortaleza - CE",
                description: "Praias paradisíacas, vida noturna agitada e cultura rica",
                price: "A partir de R$ 980"
              },
              {
                name: "Natal - RN",
                description: "Dunas incríveis, águas cristalinas e aventuras emocionantes",
                price: "A partir de R$ 1.020"
              }
            ].map((destination, index) => (
              <Card key={index} className="glass-card p-8 border-0 hover:glass-hover transition-all duration-300 hover:scale-105">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gradient">
                    {destination.name}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {destination.description}
                  </p>
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-2xl font-bold text-primary">
                      {destination.price}
                    </span>
                     <Button className="glass-button border-0" asChild>
                       <Link to="/destinos">Ver Datas</Link>
                     </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              asChild 
              size="lg"
              className="glass-button text-lg px-8 py-6 border-0"
            >
              <Link to="/destinos">
                Ver Todos os Destinos
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="glass-card p-12 border-0 text-center max-w-4xl mx-auto">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gradient">
                Pronto para Viajar?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Não perca tempo! Reserve agora sua próxima aventura e garanta 
                os melhores preços e condições de pagamento.
              </p>
              <Button 
                asChild 
                size="lg"
                className="glass-button text-lg px-8 py-6 border-0"
              >
                <Link to="/destinos">
                  Reservar Agora
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;