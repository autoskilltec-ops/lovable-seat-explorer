import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

const Checkout = () => {
  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost" 
            asChild
            className="glass-surface border-0 hover:glass-hover mb-6"
          >
            <Link to="/reserva">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Reserva
            </Link>
          </Button>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Finalizar Pagamento
          </h1>
          <p className="text-xl text-muted-foreground">
            Escolha a forma de pagamento para confirmar sua reserva
          </p>
        </div>

        {/* Payment Methods Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card p-8 border-0 hover:glass-hover transition-all duration-300 cursor-pointer">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 glass-surface rounded-xl flex items-center justify-center mx-auto">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gradient">PIX</h3>
              <p className="text-muted-foreground">
                Pagamento instantâneo via PIX
              </p>
              <Button className="w-full glass-button border-0">
                Pagar com PIX
              </Button>
            </div>
          </Card>

          <Card className="glass-card p-8 border-0 hover:glass-hover transition-all duration-300 cursor-pointer">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 glass-surface rounded-xl flex items-center justify-center mx-auto">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gradient">Cartão</h3>
              <p className="text-muted-foreground">
                Parcelamento em até 12x sem juros
              </p>
              <Button className="w-full glass-button border-0">
                Pagar com Cartão
              </Button>
            </div>
          </Card>
        </div>

        {/* Coming Soon Message */}
        <Card className="glass-card p-12 border-0 text-center mt-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gradient">
              Sistema de Pagamento
            </h3>
            <p className="text-lg text-muted-foreground">
              A integração com pagamentos PIX e cartão será implementada na próxima etapa.
              Por enquanto, você pode explorar as outras funcionalidades do sistema.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;