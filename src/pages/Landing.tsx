import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Calendar, Users, Shield, Star, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Landing() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/destinos");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}></div>
      </div>
      
      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Compass className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">ViagemTur</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="glass-button"
          >
            Entrar
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-float">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-gradient leading-tight">
              Descubra Destinos
              <br />
              <span className="text-foreground">Inesquecíveis</span>
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Planeje sua próxima aventura com facilidade. Escolha seu destino, 
            selecione seus assentos e embarque na viagem dos seus sonhos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="glass-button text-lg px-8 py-4"
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/auth")}
              className="glass-surface border-glass-border text-lg px-8 py-4"
            >
              Criar Conta
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass-card p-8 rounded-xl">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Destinos Únicos</h3>
              <p className="text-muted-foreground">
                Explore locais incríveis e experiências autênticas cuidadosamente selecionadas
              </p>
            </div>
            
            <div className="glass-card p-8 rounded-xl">
              <Calendar className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Planejamento Fácil</h3>
              <p className="text-muted-foreground">
                Sistema intuitivo para escolher datas, assentos e personalizar sua viagem
              </p>
            </div>
            
            <div className="glass-card p-8 rounded-xl">
              <Shield className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Viagem Segura</h3>
              <p className="text-muted-foreground">
                Reservas protegidas e suporte completo durante toda sua jornada
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 px-6 bg-surface/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Destinos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">1000+</div>
              <div className="text-muted-foreground">Viajantes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-success mb-2">4.9</div>
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                Avaliação
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-warning mb-2">24/7</div>
              <div className="text-muted-foreground">Suporte</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Pronto para sua próxima aventura?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Faça login ou crie sua conta para acessar destinos exclusivos e começar a planejar
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="glass-button text-lg px-12 py-4"
            >
              <Users className="mr-2 h-5 w-5" />
              Entrar na Plataforma
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-glass-border bg-surface/20 backdrop-blur-sm py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Compass className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-gradient">ViagemTur</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 ViagemTur. Transformando sonhos em realidade, uma viagem por vez.
          </p>
        </div>
      </footer>
    </div>
  );
}