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
import { Calendar, MapPin, Users, ArrowLeft, Plus, Edit, Bed, Wind, Wifi, Coffee, Clock } from "lucide-react";

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

interface EditTripForm {
  departure_date: string;
  return_date: string;
  departure_time: string;
  duration_hours: string;
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
  const [isEditTripDialogOpen, setIsEditTripDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
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

  const [editTripForm, setEditTripForm] = useState<EditTripForm>({
    departure_date: "",
    return_date: "",
    departure_time: "06:00",
    duration_hours: "24"
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

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setEditTripForm({
      departure_date: trip.departure_date,
      return_date: trip.return_date,
      departure_time: trip.departure_time,
      duration_hours: trip.duration_hours.toString()
    });
    setIsEditTripDialogOpen(true);
  };

  const handleUpdateTrip = async () => {
    if (!editingTrip || !editTripForm.departure_date || !editTripForm.return_date || 
        !editTripForm.departure_time || !editTripForm.duration_hours) {
      toast({
        title: "Erro",
        description: "Todos os campos devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("trips")
        .update({
          departure_date: editTripForm.departure_date,
          return_date: editTripForm.return_date,
          departure_time: editTripForm.departure_time,
          duration_hours: parseInt(editTripForm.duration_hours)
        })
        .eq("id", editingTrip.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Viagem atualizada com sucesso!",
      });

      setEditTripForm({
        departure_date: "",
        return_date: "",
        departure_time: "06:00",
        duration_hours: "24"
      });
      setEditingTrip(null);
      setIsEditTripDialogOpen(false);
      fetchTrips();
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar viagem. Tente novamente.",
        variant: "destructive",
      });
    }
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

  // Get unique destinations with their trips
  const uniqueDestinations = trips.reduce((acc, trip) => {
    const existingDestination = acc.find(item => item.destination.id === trip.destination.id);
    
    if (existingDestination) {
      existingDestination.trips.push(trip);
    } else {
      acc.push({
        destination: trip.destination,
        trips: [trip]
      });
    }
    
    return acc;
  }, [] as Array<{ destination: Destination; trips: Trip[] }>);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando destinos...</p>
        </div>
      </div>
    );
  }

  // Show trips for selected destination
  if (selectedDestination) {
    const destinationTrips = trips.filter(trip => trip.destination.id === selectedDestination.id);

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Render all dialogs - always available */}
        {/* Dialog para criar novo destino */}
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Destino e Viagem</DialogTitle>
                <DialogDescription>
                  Preencha as informações do destino e da primeira viagem disponível.
                </DialogDescription>
              </DialogHeader>
              
            </DialogContent>
          </Dialog>
        )}

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
              <Button variant="outline" onClick={() => setIsEditDestinationOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateDestination}>
                Atualizar Destino
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar viagem */}
        <Dialog open={isEditTripDialogOpen} onOpenChange={setIsEditTripDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Viagem</DialogTitle>
              <DialogDescription>
                Atualize as datas, horário e duração da viagem.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_trip_departure_date">Data de Saída *</Label>
                    <Input
                      id="edit_trip_departure_date"
                      type="date"
                      value={editTripForm.departure_date}
                      onChange={(e) => setEditTripForm({...editTripForm, departure_date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_trip_return_date">Data de Retorno *</Label>
                    <Input
                      id="edit_trip_return_date"
                      type="date"
                      value={editTripForm.return_date}
                      onChange={(e) => setEditTripForm({...editTripForm, return_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_trip_departure_time">Horário de Saída *</Label>
                    <Input
                      id="edit_trip_departure_time"
                      type="time"
                      value={editTripForm.departure_time}
                      onChange={(e) => setEditTripForm({...editTripForm, departure_time: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_trip_duration_hours">Duração (horas) *</Label>
                    <Input
                      id="edit_trip_duration_hours"
                      type="number"
                      min="1"
                      max="168"
                      value={editTripForm.duration_hours}
                      onChange={(e) => setEditTripForm({...editTripForm, duration_hours: e.target.value})}
                      placeholder="24"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditTripDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateTrip}>
                Atualizar Viagem
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedDestination(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Destinos
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
                <Edit className="h-4 w-4 mr-1" />
                Editar Destino
              </Button>
            )}
          </h1>
          <p className="text-muted-foreground mb-4">
            {selectedDestination.description}
          </p>
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

                {/* Conforto Section */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    Conforto
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Bed className="h-3 w-3" />
                      <span>Tipo: Leito</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wind className="h-3 w-3" />
                      <span>Ar-condicionado</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wifi className="h-3 w-3" />
                      <span>Wi-Fi</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Poltronas reclináveis</span>
                    </div>
                  </div>
                </div>

                {/* Incluso no pacote Section */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm text-foreground">Incluso no pacote</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Coffee className="h-3 w-3" />
                      <span>Café da manhã incluso</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Duração: {Math.ceil(trip.duration_hours / 24)} {Math.ceil(trip.duration_hours / 24) === 1 ? 'dia' : 'dias'} em cada excursão</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={`/checkout?trip_id=${trip.id}`} className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Reservar Esta Data
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditTrip(trip);
                      }}
                      className="px-3"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
      {/* Render dialogs - always available */}
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
            <Button variant="outline" onClick={() => setIsEditDestinationOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDestination}>
              Atualizar Destino
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar viagem */}
      <Dialog open={isEditTripDialogOpen} onOpenChange={setIsEditTripDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Viagem</DialogTitle>
            <DialogDescription>
              Atualize as datas, horário e duração da viagem.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_trip_departure_date">Data de Saída *</Label>
                  <Input
                    id="edit_trip_departure_date"
                    type="date"
                    value={editTripForm.departure_date}
                    onChange={(e) => setEditTripForm({...editTripForm, departure_date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_trip_return_date">Data de Retorno *</Label>
                  <Input
                    id="edit_trip_return_date"
                    type="date"
                    value={editTripForm.return_date}
                    onChange={(e) => setEditTripForm({...editTripForm, return_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_trip_departure_time">Horário de Saída *</Label>
                  <Input
                    id="edit_trip_departure_time"
                    type="time"
                    value={editTripForm.departure_time}
                    onChange={(e) => setEditTripForm({...editTripForm, departure_time: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_trip_duration_hours">Duração (horas) *</Label>
                  <Input
                    id="edit_trip_duration_hours"
                    type="number"
                    min="1"
                    max="168"
                    value={editTripForm.duration_hours}
                    onChange={(e) => setEditTripForm({...editTripForm, duration_hours: e.target.value})}
                    placeholder="24"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditTripDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTrip}>
              Atualizar Viagem
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Destinos Disponíveis</h1>
          <p className="text-muted-foreground">
            Escolha seu próximo destino para ver as datas disponíveis
          </p>
        </div>
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
