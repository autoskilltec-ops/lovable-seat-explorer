import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-card p-12 border-0 text-center max-w-md">
        <div className="space-y-6">
          <div className="w-16 h-16 glass-surface rounded-xl flex items-center justify-center mx-auto">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-gradient">404</h1>
            <h2 className="text-2xl font-bold text-foreground">Página não encontrada</h2>
            <p className="text-muted-foreground">
              Ops! A página que você está procurando não existe ou foi movida.
            </p>
          </div>
          <Button asChild className="glass-button border-0">
            <Link to="/home">
              <MapPin className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
