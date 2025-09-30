import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { ArrowLeft, MessageCircle } from "lucide-react";
import BusSeatMap from "@/components/BusSeatMap";

interface Trip {
  id: string;
  departure_date: string;
  return_date: string;
  price_individual: number;
  price_couple: number;
  price_group: number;
  destination: {
    name: string;
    state: string;
  };
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    planType: "individual",
    passengers: 1,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerCpf: "",
    emergencyContact: "",
    paymentMethod: "pix" as "pix" | "cartao_credito" | "cartao_debito",
    observations: "",
  });

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");

  const tripId = searchParams.get("trip_id");
  const planType = searchParams.get("plan") || "individual";

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
    setFormData(prev => ({ ...prev, planType }));
  }, [tripId, planType]);

  // Atualizar número de passageiros baseado no plano selecionado
  useEffect(() => {
    if (formData.planType === "couple") {
      setFormData(prev => ({ ...prev, passengers: 2 }));
    } else if (formData.planType === "group") {
      setFormData(prev => ({ ...prev, passengers: 4 }));
    } else if (formData.planType === "individual" && formData.passengers > 4) {
      setFormData(prev => ({ ...prev, passengers: 4 }));
    }
  }, [formData.planType]);

  // Limpar URL do WhatsApp quando o componente for desmontado
  useEffect(() => {
    return () => {
      setWhatsappUrl("");
    };
  }, []);

  // Clear selected seats when passenger count changes
  useEffect(() => {
    if (selectedSeats.length > formData.passengers) {
      const seatsToRelease = selectedSeats.slice(formData.passengers);
      if (seatsToRelease.length > 0) {
        supabase
          .from("bus_seats")
          .update({ 
            status: 'disponivel',
            reserved_until: null 
          })
          .in("id", seatsToRelease)
          .then(() => {
            setSelectedSeats(selectedSeats.slice(0, formData.passengers));
          });
      } else {
        setSelectedSeats([]);
      }
    }
  }, [formData.passengers, selectedSeats]);

  const fetchTrip = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          destination:destinations(name, state)
        `)
        .eq("id", tripId)
        .single();

      if (error) throw error;
      setTrip(data);
    } catch (error) {
      console.error("Erro ao carregar viagem:", error);
      toast({
        title: "Erro",
        description: "Viagem não encontrada",
        variant: "destructive",
      });
      navigate("/destinos");
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = () => {
    if (!trip) return 0;
    switch (formData.planType) {
      case "couple":
        return trip.price_couple;
      case "group":
        return trip.price_group;
      default:
        return trip.price_individual;
    }
  };

  const getTotalAmount = () => {
    const planPrice = getPlanPrice();
    // Apenas plano individual multiplica pelo número de passageiros
    // Casal e Grupo já têm preço fixo para 2 e 4 pessoas respectivamente
    if (formData.planType === "individual") {
      return planPrice * formData.passengers;
    }
    return planPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para fazer uma reserva",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Validar disponibilidade dos assentos antes de prosseguir
      if (selectedSeats.length > 0) {
        const { data: seatsCheck, error: seatsError } = await supabase
          .from("bus_seats")
          .select("id, status")
          .in("id", selectedSeats);

        if (seatsError) throw seatsError;

        const unavailableSeats = seatsCheck?.filter(
          seat => seat.status === 'ocupado'
        );

        if (unavailableSeats && unavailableSeats.length > 0) {
          toast({
            title: "Assentos indisponíveis",
            description: "Alguns assentos selecionados já foram ocupados. Por favor, selecione outros assentos.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      // Criar perfil se não existir (apenas para autenticação)
      await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          email: user.email || formData.customerEmail,
          full_name: user.user_metadata?.full_name || formData.customerName,
          phone: user.user_metadata?.phone || formData.customerPhone,
        });

      // Salvar dados do cliente na tabela separada
      await supabase
        .from("customer_data")
        .upsert({
          user_id: user.id,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail,
          customer_cpf: formData.customerCpf,
          emergency_contact: formData.emergencyContact,
        });

      // Determinar status inicial da reserva baseado no tipo de usuário
      const initialStatus = isAdmin ? 'pago' : 'pendente';
      
      console.log('🔍 Debug Checkout:', {
        userId: user.id,
        userEmail: user.email,
        isAdmin,
        initialStatus,
        planType: formData.planType,
        passengers: formData.passengers
      });
      
      // Criar reserva com status baseado no tipo de usuário
      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          trip_id: tripId,
          plan_type: formData.planType,
          passengers: formData.passengers,
          total_amount: getTotalAmount(),
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail,
          customer_cpf: formData.customerCpf,
          emergency_contact: formData.emergencyContact,
          seat_ids: selectedSeats,
          codigo_confirmacao: Math.random().toString(36).substring(2, 10).toUpperCase(),
          status: initialStatus,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      console.log('✅ Reserva criada:', {
        id: reservation.id,
        status: reservation.status,
        codigo: reservation.codigo_confirmacao
      });

      // Criar registro de pagamento
      const paymentMethod = formData.paymentMethod === "cartao_credito" || formData.paymentMethod === "cartao_debito" ? "cartao" : "pix";
      
      // Status do pagamento baseado no tipo de usuário
      const paymentStatus = isAdmin ? 'aprovado' : 'iniciado';
      
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          amount: getTotalAmount(),
          method: paymentMethod,
          payment_method_preference: formData.paymentMethod,
          reservation_id: reservation.id,
          status: paymentStatus,
        });

      if (paymentError) throw paymentError;

      // Se for admin, a reserva já foi criada como 'pago'
      // Se for usuário normal, manter como 'pendente' para aprovação posterior
      if (isAdmin) {
        // Para admin, a reserva já está como 'pago', então os assentos já foram atualizados
        // Não precisa fazer nada adicional
      } else {
        // Para usuários normais, a reserva fica como 'pendente'
        // Os assentos não são ocupados até o admin confirmar
        console.log('Reserva criada como pendente, aguardando confirmação do admin');
      }

      // Enviar para WhatsApp
      await sendToWhatsApp(reservation);

      toast({
        title: isAdmin ? "Reserva confirmada com sucesso!" : "Reserva criada com sucesso!",
        description: isAdmin 
          ? "Abrindo WhatsApp e redirecionando para Minhas Reservas..." 
          : "Sua reserva foi criada e está aguardando confirmação. Abrindo WhatsApp...",
      });

      navigate("/minhas-reservas");

    } catch (error: any) {
      console.error("Erro ao criar reserva:", error);
      toast({
        title: "Erro ao processar reserva",
        description: error.message || "Ocorreu um erro ao processar sua reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sendToWhatsApp = async (reservation: any) => {
    if (!trip) return;

    let seatNumbers = "A definir";
    if (selectedSeats.length > 0) {
      try {
        const { data: seatsData } = await supabase
          .from("bus_seats")
          .select("seat_number")
          .in("id", selectedSeats);
        
        if (seatsData) {
          seatNumbers = seatsData
            .map(seat => seat.seat_number)
            .sort((a, b) => a - b)
            .join(", ");
        }
      } catch (error) {
        console.error("Erro ao buscar números dos assentos:", error);
      }
    }

    const statusMessage = isAdmin ? "✅ *CONFIRMADA*" : "⏳ *AGUARDANDO CONFIRMAÇÃO*";
    
    const message = `🚌 *NOVA RESERVA DE VIAGEM*

👤 *Cliente:* ${formData.customerName}
📱 *Telefone:* ${formData.customerPhone}
📧 *Email:* ${formData.customerEmail}
🆔 *CPF:* ${formData.customerCpf}
🚨 *Contato Emergência:* ${formData.emergencyContact}

🎯 *Destino:* ${trip.destination.name} - ${trip.destination.state}
📅 *Ida:* ${new Date(trip.departure_date).toLocaleDateString("pt-BR")}
📅 *Volta:* ${new Date(trip.return_date).toLocaleDateString("pt-BR")}

👥 *Plano:* ${formData.planType === "individual" ? "Individual" : formData.planType === "couple" ? "Casal" : "Grupo"}
🎫 *Passageiros:* ${formData.passengers}
🪑 *Assentos:* ${seatNumbers}
💰 *Valor Total:* ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(getTotalAmount())}

💳 *Método de Pagamento Preferido:* ${formData.paymentMethod === "pix" ? "PIX" : formData.paymentMethod === "cartao_credito" ? "Cartão de Crédito" : "Cartão de Débito"}

🔖 *Código da Reserva:* ${reservation.codigo_confirmacao}
📊 *Status:* ${statusMessage}

${formData.observations ? `📝 *Observações:* ${formData.observations}` : ""}`;

    const encodedMessage = encodeURIComponent(message);
    // Formatar número de telefone corretamente (remover caracteres especiais e garantir formato internacional)
    const phone = "5586994419038".replace(/\D/g, '');

    // Detecção melhorada de dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    let generatedWhatsappUrl = "";
    let success = false;

    try {
      if (isMobile) {
        if (isIOS) {
          // iOS - tentar app primeiro, depois web
          generatedWhatsappUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
          try {
            window.location.href = generatedWhatsappUrl;
            success = true;
          } catch (error) {
            // Fallback para web no iOS
            generatedWhatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
            window.open(generatedWhatsappUrl, '_blank');
            success = true;
          }
        } else if (isAndroid) {
          // Android - usar wa.me
          generatedWhatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
          window.open(generatedWhatsappUrl, '_blank');
          success = true;
        } else {
          // Outros dispositivos móveis
          generatedWhatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
          window.open(generatedWhatsappUrl, '_blank');
          success = true;
        }
      } else {
        // Desktop - usar web.whatsapp.com
        generatedWhatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
        const newWindow = window.open(generatedWhatsappUrl, '_blank', 'noopener,noreferrer');
        
        if (newWindow) {
          success = true;
          // Verificar se a janela foi bloqueada pelo popup blocker
          setTimeout(() => {
            if (newWindow.closed === undefined) {
              // Popup foi bloqueado, redirecionar na mesma janela
              window.location.href = generatedWhatsappUrl;
            }
          }, 1000);
        } else {
          // Popup foi bloqueado, redirecionar na mesma janela
          window.location.href = generatedWhatsappUrl;
          success = true;
        }
      }

      if (!success) {
        throw new Error('Não foi possível abrir o WhatsApp');
      }

    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      
      // Fallback final - tentar abrir em nova aba
      try {
        window.open(generatedWhatsappUrl, '_blank');
      } catch (fallbackError) {
        // Último recurso - redirecionar na mesma janela
        window.location.href = generatedWhatsappUrl;
      }
      
      // Salvar URL para fallback manual
      setWhatsappUrl(generatedWhatsappUrl);
      
      // Mostrar toast de aviso
      toast({
        title: "Atenção",
        description: "Tentando abrir o WhatsApp. Se não abrir automaticamente, clique no link que será exibido.",
        variant: "default",
      });
    }
  };

  const handleSubmitWithValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSeats.length !== formData.passengers) {
      toast({
        title: "Erro",
        description: `Você deve selecionar ${formData.passengers} assento(s)`,
        variant: "destructive",
      });
      return;
    }

    await handleSubmit(e);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Viagem não encontrada</h2>
        <Button onClick={() => navigate("/destinos")}>
          Voltar aos Destinos
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/destinos")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar aos Destinos
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Resumo da Viagem */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Viagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">{trip.destination.name}</h3>
              <Badge variant="secondary">{trip.destination.state}</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Ida:</span>
                <span>{new Date(trip.departure_date).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex justify-between">
                <span>Volta:</span>
                <span>{new Date(trip.return_date).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Plano:</span>
                <span className="capitalize">{formData.planType}</span>
              </div>
              <div className="flex justify-between">
                <span>Passageiros:</span>
                <span>{formData.passengers}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(getTotalAmount())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seleção de Assentos */}
        <BusSeatMap
          tripId={tripId!}
          maxPassengers={formData.passengers}
          selectedSeats={selectedSeats}
          onSeatSelection={setSelectedSeats}
          isAdmin={false}
        />

        {/* Formulário */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados da Reserva</CardTitle>
            <CardDescription>
              Preencha seus dados para finalizar a reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitWithValidation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Plano e Passageiros</h4>
                </div>
                <div>
                  <Label htmlFor="planType">Plano da Viagem</Label>
                  <RadioGroup
                    value={formData.planType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, planType: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual">
                        Individual - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(trip.price_individual)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="couple" id="couple" />
                      <Label htmlFor="couple">
                        Casal - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(trip.price_couple)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="group" id="group" />
                      <Label htmlFor="group">
                        Grupo (4+) - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(trip.price_group)}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="passengers">Número de Passageiros</Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max={formData.planType === "individual" ? "4" : undefined}
                    value={formData.passengers}
                    onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
                    disabled={formData.planType === "couple" || formData.planType === "group"}
                    required
                    className={formData.planType !== "individual" ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Informações do Responsável</h4>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="customerName">Nome completo do Responsável</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    required
                  />
                </div>
                <div className="md:col-span-2 pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Contato</h4>
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefone</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    required
                  />
                </div>
                <div className="md:col-span-2 pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Documentos e Emergência</h4>
                </div>
                <div>
                  <Label htmlFor="customerCpf">CPF</Label>
                  <Input
                    id="customerCpf"
                    value={formData.customerCpf}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerCpf: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Contato de Emergência</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    required
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Pagamento e Observações</h4>
                </div>
                <div className="md:col-span-2">
                  <Label>Método de Pagamento Preferido</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as any }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix">PIX</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cartao_credito" id="cartao_credito" />
                      <Label htmlFor="cartao_credito">Cartão de Crédito</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cartao_debito" id="cartao_debito" />
                      <Label htmlFor="cartao_debito">Cartão de Débito</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting}
              >
                {submitting ? "Processando..." : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Finalizar e Enviar para WhatsApp
                  </>
                )}
              </Button>

              {whatsappUrl && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Se o WhatsApp não abriu automaticamente, clique no botão abaixo:
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(whatsappUrl, '_blank')}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Abrir WhatsApp Manualmente
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}