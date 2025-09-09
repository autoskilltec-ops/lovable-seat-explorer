import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, ArrowLeft, Plus } from "lucide-react";

interface Destination {
  id: string;
  name: string;
  state: string;
  description: string;
  image_url: string;
}

interface Trip {
  id: string;
  departure_date: string;
  return_date: string;
  price_individual: number;
  price_couple: number;
  price_group: number;
  destination: Destination;
}

export default function Destinos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDestination, setNewDestination] = useState({
    name: "",
    state: "",
    description: "",
    image_url: ""
  });

  const [newTrip, setNewTrip] = useState({
    departure_date: "",
    return_date: "",
    price_individual: "",
    price_couple: "",
    price_group: ""
  });

  useEffect(() => {
    fetchTrips();
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === "admin");
    } catch (error) {
      console.error("Erro ao verificar status de admin:", error);
    }
  };

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          destination:destinations(*)
        `)
        .order("departure_date", { ascending: true });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleCreateDestination = async () => {
    if (!newDestination.name || !newDestination.state || !newDestination.description) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios do destino devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }

    if (!newTrip.departure_date || !newTrip.return_date || 
        !newTrip.price_individual || !newTrip.price_couple || !newTrip.price_group) {
      toast({
        title: "Erro", 
        description: "Todos os campos da viagem devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar destino primeiro
      const { data: destinationData, error: destinationError } = await supabase
        .from("destinations")
        .insert([newDestination])
        .select()
        .single();

      if (destinationError) throw destinationError;

      // Criar viagem associada ao destino
      const { error: tripError } = await supabase
        .from("trips")
        .insert([{
          destination_id: destinationData.id,
          departure_date: newTrip.departure_date,
          return_date: newTrip.return_date,
          price_individual: parseFloat(newTrip.price_individual),
          price_couple: parseFloat(newTrip.price_couple),
          price_group: parseFloat(newTrip.price_group)
        }]);

      if (tripError) throw tripError;

      toast({
        title: "Sucesso",
        description: "Destino e viagem criados com sucesso!",
      });

      setNewDestination({
        name: "",
        state: "",
        description: "",
        image_url: ""
      });
      setNewTrip({
        departure_date: "",
        return_date: "",
        price_individual: "",
        price_couple: "",
        price_group: ""
      });
      setIsDialogOpen(false);
      fetchTrips(); // Recarregar dados para mostrar o novo destino
    } catch (error) {
      console.error("Erro ao criar destino:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar destino e viagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Agrupar viagens por destino
  const groupedByDestination = trips.reduce((acc, trip) => {
    const destinationId = trip.destination.id;
    if (!acc[destinationId]) {
      acc[destinationId] = {
        destination: trip.destination,
        trips: []
      };
    }
    acc[destinationId].trips.push(trip);
    return acc;
  }, {} as Record<string, { destination: Destination; trips: Trip[] }>);

  const uniqueDestinations = Object.values(groupedByDestination);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Se um destino foi selecionado, mostrar apenas as viagens desse destino
  if (selectedDestination) {
    const destinationTrips = groupedByDestination[selectedDestination.id]?.trips || [];
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedDestination(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos destinos
          </Button>
          
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-primary" />
            {selectedDestination.name}
          </h1>
          <p className="text-muted-foreground mb-4">
            {selectedDestination.description}
          </p>
          <Badge variant="secondary" className="text-sm">
            {selectedDestination.state}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinationTrips.map((trip) => (
            <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={trip.destination.image_url || "/placeholder.svg"}
                  alt={trip.destination.name}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm">
                  Disponível
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {formatDate(trip.departure_date)} - {formatDate(trip.return_date)}
                </CardTitle>
                <CardDescription>
                  Datas de ida e volta incluídas no pacote
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      Individual
                    </span>
                    <span className="font-bold text-primary">
                      {formatPrice(trip.price_individual)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      Casal
                    </span>
                    <span className="font-bold text-primary">
                      {formatPrice(trip.price_couple)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      Grupo (4+)
                    </span>
                    <span className="font-bold text-primary">
                      {formatPrice(trip.price_group)}
                    </span>
                  </div>
                </div>

                <Link to={`/checkout?trip_id=${trip.id}`} className="block w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Reservar Esta Data
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {destinationTrips.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma data disponível para este destino
            </h3>
            <p className="text-muted-foreground">
              Novas datas serão adicionadas em breve.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Destinos Disponíveis</h1>
          <p className="text-muted-foreground">
            Escolha seu próximo destino para ver as datas disponíveis
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Destino
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Destino e Viagem</DialogTitle>
                <DialogDescription>
                  Preencha as informações do destino e da primeira viagem disponível.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações do Destino</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={newDestination.name}
                        onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
                        placeholder="Ex: Fortaleza"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={newDestination.state}
                        onChange={(e) => setNewDestination({...newDestination, state: e.target.value})}
                        placeholder="Ex: CE"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        value={newDestination.description}
                        onChange={(e) => setNewDestination({...newDestination, description: e.target.value})}
                        placeholder="Descreva o destino..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="image_url">URL da Imagem</Label>
                      <Input
                        id="image_url"
                        value={newDestination.image_url}
                        onChange={(e) => setNewDestination({...newDestination, image_url: e.target.value})}
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações da Viagem</h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="departure_date">Data de Saída *</Label>
                        <Input
                          id="departure_date"
                          type="date"
                          value={newTrip.departure_date}
                          onChange={(e) => setNewTrip({...newTrip, departure_date: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="return_date">Data de Retorno *</Label>
                        <Input
                          id="return_date"
                          type="date"
                          value={newTrip.return_date}
                          onChange={(e) => setNewTrip({...newTrip, return_date: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price_individual">Preço Individual *</Label>
                        <Input
                          id="price_individual"
                          type="number"
                          step="0.01"
                          value={newTrip.price_individual}
                          onChange={(e) => setNewTrip({...newTrip, price_individual: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price_couple">Preço Casal *</Label>
                        <Input
                          id="price_couple"
                          type="number"
                          step="0.01"
                          value={newTrip.price_couple}
                          onChange={(e) => setNewTrip({...newTrip, price_couple: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price_group">Preço Grupo *</Label>
                        <Input
                          id="price_group"
                          type="number"
                          step="0.01"
                          value={newTrip.price_group}
                          onChange={(e) => setNewTrip({...newTrip, price_group: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateDestination}>
                  Criar Destino e Viagem
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uniqueDestinations.map(({ destination, trips }) => (
          <Card 
            key={destination.id} 
            className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
            onClick={() => setSelectedDestination(destination)}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={destination.image_url || "/placeholder.svg"}
                alt={destination.name}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-4 right-4 bg-primary">
                {destination.state}
              </Badge>
              <Badge className="absolute top-4 left-4 bg-green-600">
                {trips.length} {trips.length === 1 ? 'data' : 'datas'} disponível{trips.length > 1 ? 'eis' : ''}
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {destination.name}
              </CardTitle>
              <CardDescription>
                {destination.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">A partir de:</span>
                <span className="font-bold text-lg text-primary">
                  {formatPrice(Math.min(...trips.map(t => t.price_individual)))}
                </span>
              </div>

              <Button className="w-full" variant="outline">
                Ver Datas Disponíveis
                <Calendar className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {uniqueDestinations.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">
            Nenhum destino disponível
          </h3>
          <p className="text-muted-foreground">
            Novos destinos serão adicionados em breve.
          </p>
        </div>
      )}
    </div>
  );
}

