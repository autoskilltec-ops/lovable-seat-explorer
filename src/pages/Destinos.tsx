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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, ArrowLeft, Plus, Edit } from "lucide-react";

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
  departure_time: string;
  duration_hours: number;
  price_individual: number;
  price_couple: number;
  price_group: number;
  destination: Destination;
}

interface NewDestinationForm {
  name: string;
  state: string;
  description: string;
  image_url: string;
}

interface NewTripForm {
  departure_date: string;
  return_date: string;
  departure_time: string;
  duration_hours: string;
  price_individual: string;
  price_couple: string;
  price_group: string;
}

interface NewTripForDestinationForm {
  departure_date: string;
  return_date: string;
  departure_time: string;
  duration_hours: string;
  price_individual: string;
  price_couple: string;
  price_group: string;
  bus_quantity: string;
}

export default function Destinos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddTripDialogOpen, setIsAddTripDialogOpen] = useState(false);
  const [isEditDestinationOpen, setIsEditDestinationOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [newDestination, setNewDestination] = useState<NewDestinationForm>({
    name: "",
    state: "",
    description: "",
    image_url: ""
  });

  const [newTrip, setNewTrip] = useState<NewTripForm>({
    departure_date: "",
    return_date: "",
    departure_time: "06:00",
    duration_hours: "24",
    price_individual: "",
    price_couple: "",
    price_group: ""
  });

  const [newTripForDestination, setNewTripForDestination] = useState<NewTripForDestinationForm>({
    departure_date: "",
    return_date: "",
    departure_time: "06:00",
    duration_hours: "24",
    price_individual: "",
    price_couple: "",
    price_group: "",
    bus_quantity: "1"
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

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Remove seconds from HH:MM:SS
  };

  const handleEditDestination = (destination: Destination) => {
    setEditingDestination(destination);
    setNewDestination({
      name: destination.name,
      state: destination.state,
      description: destination.description,
      image_url: destination.image_url
    });
    setIsEditDestinationOpen(true);
  };

  const handleUpdateDestination = async () => {
    if (!editingDestination || !newDestination.name || !newDestination.state || !newDestination.description) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("destinations")
        .update({
          name: newDestination.name,
          state: newDestination.state,
          description: newDestination.description,
          image_url: newDestination.image_url
        })
        .eq("id", editingDestination.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Destino atualizado com sucesso!",
      });

      setNewDestination({
        name: "",
        state: "",
        description: "",
        image_url: ""
      });
      setEditingDestination(null);
      setIsEditDestinationOpen(false);
      fetchTrips();
    } catch (error) {
      console.error("Erro ao atualizar destino:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar destino. Tente novamente.",
        variant: "destructive",
      });
    }
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

    if (!newTrip.departure_date || !newTrip.return_date || !newTrip.departure_time ||
        !newTrip.duration_hours || !newTrip.price_individual || !newTrip.price_couple || !newTrip.price_group) {
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

      // Criar viagem associada ao destino com 3 ônibus
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .insert([{
          destination_id: destinationData.id,
          departure_date: newTrip.departure_date,
          return_date: newTrip.return_date,
          departure_time: newTrip.departure_time,
          duration_hours: parseInt(newTrip.duration_hours),
          price_individual: parseFloat(newTrip.price_individual),
          price_couple: parseFloat(newTrip.price_couple),
          price_group: parseFloat(newTrip.price_group),
          bus_quantity: 3
        }])
        .select()
        .single();

      if (tripError) throw tripError;

      // Criar 3 ônibus para esta viagem
      const busesToCreate = Array.from({ length: 3 }, (_, i) => ({
        trip_id: tripData.id,
        bus_number: i + 1
      }));

      const { data: busesData, error: busesError } = await (supabase as any)
        .from("buses")
        .insert(busesToCreate)
        .select();

      if (busesError) throw busesError;

      // Criar 60 assentos para cada ônibus
      const seatsToCreate = [];
      for (const bus of (busesData as any)) {
        for (let seatNum = 1; seatNum <= 60; seatNum++) {
          seatsToCreate.push({
            trip_id: tripData.id,
            bus_id: bus.id,
            seat_number: seatNum,
            status: 'disponivel'
          });
        }
      }

      if (seatsToCreate.length > 0) {
        const { error: seatsError } = await supabase
          .from("bus_seats")
          .insert(seatsToCreate);

        if (seatsError) throw seatsError;
      }

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
        departure_time: "06:00",
        duration_hours: "24",
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

  const populateExistingTripsWithBuses = async () => {
    try {
      // Buscar trips que não têm buses
      const { data: tripsWithoutBuses, error: tripsError } = await supabase
        .from("trips")
        .select(`
          id, 
          bus_quantity,
          buses!inner(id)
        `)
        .is("buses.id", null);

      if (tripsError) {
        console.log("Buscando todas as trips para verificar buses...");
        
        // Fallback: buscar todas as trips e verificar quais não têm buses
        const { data: allTrips, error: allTripsError } = await supabase
          .from("trips")
          .select("id, bus_quantity");

        if (allTripsError) throw allTripsError;

        const { data: existingBuses, error: busesError } = await supabase
          .from("buses" as any)
          .select("trip_id");

        if (busesError) throw busesError;

        const tripIdsWithBuses = new Set((existingBuses as any)?.map((b: any) => b.trip_id) || []);
        const tripsNeedingBuses = (allTrips || []).filter(trip => !tripIdsWithBuses.has(trip.id));

        for (const trip of tripsNeedingBuses) {
          await createBusesForTrip(trip.id, 3);
        }

        toast({
          title: "Sucesso",
          description: `Criados ônibus para ${tripsNeedingBuses.length} viagens existentes.`,
        });
        return;
      }

      // Processar trips sem buses
      for (const trip of tripsWithoutBuses || []) {
        await createBusesForTrip(trip.id, 3);
      }

      toast({
        title: "Sucesso",
        description: `Criados ônibus para ${tripsWithoutBuses?.length || 0} viagens existentes.`,
      });

    } catch (error) {
      console.error("Erro ao popular trips com ônibus:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar ônibus para viagens existentes.",
        variant: "destructive",
      });
    }
  };

  const createBusesForTrip = async (tripId: string, busQuantity: number) => {
    // Atualizar bus_quantity na trip se necessário
    await supabase
      .from("trips")
      .update({ bus_quantity: busQuantity })
      .eq("id", tripId);

    // Criar ônibus
    const busesToCreate = Array.from({ length: busQuantity }, (_, i) => ({
      trip_id: tripId,
      bus_number: i + 1
    }));

    const { data: busesData, error: busesError } = await (supabase as any)
      .from("buses")
      .insert(busesToCreate)
      .select();

    if (busesError) throw busesError;

    // Criar assentos para cada ônibus
    const seatsToCreate = [];
    for (const bus of (busesData as any)) {
      for (let seatNum = 1; seatNum <= 60; seatNum++) {
        seatsToCreate.push({
          trip_id: tripId,
          bus_id: bus.id,
          seat_number: seatNum,
          status: 'disponivel'
        });
      }
    }

    if (seatsToCreate.length > 0) {
      const { error: seatsError } = await supabase
        .from("bus_seats")
        .insert(seatsToCreate);

      if (seatsError) throw seatsError;
    }
  };

  const handleCreateTripForDestination = async () => {
    if (!selectedDestination) return;

    if (!newTripForDestination.departure_date || !newTripForDestination.return_date ||
        !newTripForDestination.departure_time || !newTripForDestination.duration_hours ||
        !newTripForDestination.price_individual || !newTripForDestination.price_couple || 
        !newTripForDestination.price_group || !newTripForDestination.bus_quantity) {
      toast({
        title: "Erro",
        description: "Preencha todas as informações da nova viagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the trip first
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .insert([{ 
          destination_id: selectedDestination.id,
          departure_date: newTripForDestination.departure_date,
          return_date: newTripForDestination.return_date,
          departure_time: newTripForDestination.departure_time,
          duration_hours: parseInt(newTripForDestination.duration_hours),
          price_individual: parseFloat(newTripForDestination.price_individual),
          price_couple: parseFloat(newTripForDestination.price_couple),
          price_group: parseFloat(newTripForDestination.price_group)
        }])
        .select()
        .single();

      if (tripError) throw tripError;

      // Create buses for this trip with bus_quantity
      const busQuantity = parseInt(newTripForDestination.bus_quantity);
      const { data: tripWithBusData, error: tripWithBusError } = await supabase
        .from("trips")
        .update({ bus_quantity: busQuantity })
        .eq("id", tripData.id);

      if (tripWithBusError) console.warn("Bus quantity update warning:", tripWithBusError);

      // Create buses for this trip
      const busesToCreate = Array.from({ length: busQuantity }, (_, i) => ({
        trip_id: tripData.id,
        bus_number: i + 1
      }));

      const { data: busesData, error: busesError } = await supabase
        .from("buses" as any)
        .insert(busesToCreate)
        .select();

      if (busesError) throw busesError;

      // Create 60 seats for each bus
      const seatsToCreate = [];
      for (const bus of (busesData as any)) {
        for (let seatNum = 1; seatNum <= 60; seatNum++) {
          seatsToCreate.push({
            trip_id: tripData.id,
            bus_id: bus.id,
            seat_number: seatNum,
            status: 'disponivel'
          });
        }
      }

      const { error: seatsError } = await supabase
        .from("bus_seats")
        .insert(seatsToCreate);

      if (seatsError) throw seatsError;

      toast({
        title: "Sucesso",
        description: `Nova viagem criada com ${busQuantity} ônibus e ${busQuantity * 60} assentos!`,
      });

      setNewTripForDestination({
        departure_date: "",
        return_date: "",
        departure_time: "06:00",
        duration_hours: "24",
        price_individual: "",
        price_couple: "",
        price_group: "",
        bus_quantity: "1"
      });
      setIsAddTripDialogOpen(false);
      await fetchTrips();
    } catch (error) {
      console.error("Erro ao criar viagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a nova viagem.",
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
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditDestination(selectedDestination)}
                className="ml-auto"
              >
                Editar Destino
              </Button>
            )}
          </h1>
          <p className="text-muted-foreground mb-4">
            {selectedDestination.description}
          </p>
          <Badge variant="secondary" className="text-sm">
            {selectedDestination.state}
          </Badge>

          {isAdmin && (
            <div className="mt-4">
              <Dialog open={isAddTripDialogOpen} onOpenChange={setIsAddTripDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Nova data para {selectedDestination.name}</DialogTitle>
                    <DialogDescription>
                      Cadastre uma nova data mantendo o mesmo destino.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="departure_date_new">Data de Saída *</Label>
                        <Input
                          id="departure_date_new"
                          type="date"
                          value={newTripForDestination.departure_date}
                          onChange={(e) => setNewTripForDestination({ ...newTripForDestination, departure_date: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="return_date_new">Data de Retorno *</Label>
                        <Input
                          id="return_date_new"
                          type="date"
                          value={newTripForDestination.return_date}
                          onChange={(e) => setNewTripForDestination({ ...newTripForDestination, return_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="departure_time_new">Horário de Saída *</Label>
                        <Input
                          id="departure_time_new"
                          type="time"
                          value={newTripForDestination.departure_time}
                          onChange={(e) => setNewTripForDestination({ ...newTripForDestination, departure_time: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="duration_hours_new">Duração (horas) *</Label>
                        <Input
                          id="duration_hours_new"
                          type="number"
                          min="1"
                          max="168"
                          value={newTripForDestination.duration_hours}
                          onChange={(e) => setNewTripForDestination({ ...newTripForDestination, duration_hours: e.target.value })}
                          placeholder="24"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price_individual_new">Preço Individual *</Label>
                        <Input
                          id="price_individual_new"
                          type="number"
                          step="0.01"
                          value={newTripForDestination.price_individual}
                          onChange={(e) => setNewTripForDestination({ ...newTripForDestination, price_individual: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price_couple_new">Preço Casal *</Label>
                        <Input
                          id="price_couple_new"
                          type="number"
                          step="0.01"
                          value={newTripForDestination.price_couple}
                          onChange={(e) => setNewTripForDestination({ ...newTripForDestination, price_couple: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price_group_new">Preço Grupo *</Label>
                        <Input
                          id="price_group_new"
                          type="number"
                          step="0.01"
                          value={newTripForDestination.price_group}
                          onChange={(e) => setNewTripForDestination({ ...newTripForDestination, price_group: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bus_quantity_new">Quantidade de Ônibus *</Label>
                      <select
                        id="bus_quantity_new"
                        value={newTripForDestination.bus_quantity}
                        onChange={(e) => setNewTripForDestination({ ...newTripForDestination, bus_quantity: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="1">1 Ônibus (60 assentos)</option>
                        <option value="2">2 Ônibus (120 assentos)</option>
                        <option value="3">3 Ônibus (180 assentos)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddTripDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateTripForDestination}>Salvar Data</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
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
                <CardDescription className="space-y-1">
                  <div>Datas de ida e volta incluídas no pacote</div>
                  <div className="text-sm">
                    <strong>Saída:</strong> {formatTime(trip.departure_time)} | 
                    <strong> Duração:</strong> {trip.duration_hours}h
                  </div>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="departure_time">Horário de Saída *</Label>
                        <Input
                          id="departure_time"
                          type="time"
                          value={newTrip.departure_time}
                          onChange={(e) => setNewTrip({...newTrip, departure_time: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="duration_hours">Duração (horas) *</Label>
                        <Input
                          id="duration_hours"
                          type="number"
                          min="1"
                          max="168"
                          value={newTrip.duration_hours}
                          onChange={(e) => setNewTrip({...newTrip, duration_hours: e.target.value})}
                          placeholder="24"
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

      {/* Dialog para editar destino */}
      <Dialog open={isEditDestinationOpen} onOpenChange={setIsEditDestinationOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Destino</DialogTitle>
            <DialogDescription>
              Atualize as informações do destino selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Nome *</Label>
                <Input
                  id="edit_name"
                  value={newDestination.name}
                  onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
                  placeholder="Ex: Fortaleza"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_state">Estado *</Label>
                <Input
                  id="edit_state"
                  value={newDestination.state}
                  onChange={(e) => setNewDestination({...newDestination, state: e.target.value})}
                  placeholder="Ex: CE"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_description">Descrição *</Label>
                <Textarea
                  id="edit_description"
                  value={newDestination.description}
                  onChange={(e) => setNewDestination({...newDestination, description: e.target.value})}
                  placeholder="Descreva o destino..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_image_url">URL da Imagem</Label>
                <Input
                  id="edit_image_url"
                  value={newDestination.image_url}
                  onChange={(e) => setNewDestination({...newDestination, image_url: e.target.value})}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditDestinationOpen(false);
              setEditingDestination(null);
              setNewDestination({ name: "", state: "", description: "", image_url: "" });
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDestination}>
              Atualizar Destino
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

