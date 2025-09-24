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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, ArrowLeft, Plus, Edit, Bed, Wind, Wifi, Coffee, Clock, Trash2 } from "lucide-react";

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
  includes_accommodation?: boolean;
  includes_breakfast?: boolean;
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
  includes_accommodation: boolean;
  includes_breakfast: boolean;
}

export default function Destinos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreateDestinationDialogOpen, setIsCreateDestinationDialogOpen] = useState(false);
  const [isAddTripDialogOpen, setIsAddTripDialogOpen] = useState(false);
  const [isEditDestinationOpen, setIsEditDestinationOpen] = useState(false);
  const [isEditTripDialogOpen, setIsEditTripDialogOpen] = useState(false);
  const [isDeleteTripDialogOpen, setIsDeleteTripDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
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
    duration_hours: "24",
    includes_accommodation: true,
    includes_breakfast: true
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
      // Primeiro busca todos os destinos
      const { data: destinationsData, error: destError } = await supabase
        .from("destinations")
        .select("*")
        .order("name");
      
      if (destError) throw destError;

      // Depois busca todos os trips
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select("*")
        .order("departure_date", { ascending: true });

      if (tripsError) throw tripsError;

      // Combina destinos com trips
      const allTrips = [];
      
      destinationsData?.forEach(destination => {
        const destinationTrips = tripsData?.filter(trip => trip.destination_id === destination.id) || [];
        
        if (destinationTrips.length > 0) {
          // Se tem trips, adiciona cada trip com o destino
          destinationTrips.forEach(trip => {
            allTrips.push({
              ...trip,
              destination: destination
            });
          });
        } else {
          // Se não tem trips, cria um trip vazio para mostrar o destino
          allTrips.push({
            id: "",
            departure_date: "",
            return_date: "",
            departure_time: "",
            duration_hours: 0,
            price_individual: 0,
            price_couple: 0,
            price_group: 0,
            destination: destination
          });
        }
      });
      
      setTrips(allTrips);
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar destinos e viagens",
        variant: "destructive",
      });
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
      duration_hours: trip.duration_hours.toString(),
      includes_accommodation: trip.includes_accommodation ?? true,
      includes_breakfast: trip.includes_breakfast ?? true
    });
    setIsEditTripDialogOpen(true);
  };

  const handleDeleteTrip = (trip: Trip) => {
    setDeletingTrip(trip);
    setIsDeleteTripDialogOpen(true);
  };

  const confirmDeleteTrip = async () => {
    if (!deletingTrip || !deletingTrip.id) {
      toast({
        title: "Erro",
        description: "Nenhuma data selecionada para exclusão.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_trip_cascade', {
        trip_uuid: deletingTrip.id
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Data excluída com sucesso! Todas as reservas e dados relacionados foram removidos.",
      });

      setDeletingTrip(null);
      setIsDeleteTripDialogOpen(false);
      fetchTrips();
    } catch (error) {
      console.error("Erro ao excluir data:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir data. Tente novamente.",
        variant: "destructive",
      });
    }
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
          duration_hours: parseInt(editTripForm.duration_hours),
          includes_accommodation: editTripForm.includes_accommodation,
          includes_breakfast: editTripForm.includes_breakfast
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
        duration_hours: "24",
        includes_accommodation: true,
        includes_breakfast: true
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

  const handleCreateDestination = async () => {
    if (!newDestination.name || !newDestination.state || !newDestination.description) {
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
        .insert({
          name: newDestination.name,
          state: newDestination.state,
          description: newDestination.description,
          image_url: newDestination.image_url
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Destino criado com sucesso!",
      });

      setNewDestination({
        name: "",
        state: "",
        description: "",
        image_url: ""
      });
      setIsCreateDestinationDialogOpen(false);
      fetchTrips();
    } catch (error) {
      console.error("Erro ao criar destino:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar destino. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTripForDestination = async () => {
    if (!selectedDestination || !newTripForDestination.departure_date || 
        !newTripForDestination.return_date || !newTripForDestination.departure_time ||
        !newTripForDestination.price_individual || !newTripForDestination.price_couple ||
        !newTripForDestination.price_group) {
      toast({
        title: "Erro",
        description: "Todos os campos devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create trip
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .insert({
          destination_id: selectedDestination.id,
          departure_date: newTripForDestination.departure_date,
          return_date: newTripForDestination.return_date,
          departure_time: newTripForDestination.departure_time,
          duration_hours: parseInt(newTripForDestination.duration_hours),
          price_individual: parseFloat(newTripForDestination.price_individual),
          price_couple: parseFloat(newTripForDestination.price_couple),
          price_group: parseFloat(newTripForDestination.price_group),
          bus_quantity: parseInt(newTripForDestination.bus_quantity),
          includes_accommodation: true,
          includes_breakfast: true
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Create buses for the trip
      const buses = Array.from({ length: parseInt(newTripForDestination.bus_quantity) }, (_, index) => ({
        trip_id: tripData.id,
        bus_number: index + 1
      }));

      const { data: busData, error: busError } = await supabase
        .from("buses")
        .insert(buses)
        .select();

      if (busError) throw busError;

      // Create seats for each bus (45 seats per bus)
      const allSeats = [];
      busData.forEach((bus) => {
        for (let seatNumber = 1; seatNumber <= 45; seatNumber++) {
          allSeats.push({
            trip_id: tripData.id,
            bus_id: bus.id,
            seat_number: seatNumber,
            status: 'disponivel'
          });
        }
      });

      const { error: seatError } = await supabase
        .from("bus_seats")
        .insert(allSeats);

      if (seatError) throw seatError;

      toast({
        title: "Sucesso",
        description: "Nova data criada com sucesso!",
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
      fetchTrips();
    } catch (error) {
      console.error("Erro ao criar viagem:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar nova data. Tente novamente.",
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
        
        {/* Dialog para adicionar nova data/viagem ao destino */}
        {isAdmin && (
          <Dialog open={isAddTripDialogOpen} onOpenChange={setIsAddTripDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Data</DialogTitle>
                <DialogDescription>
                  Crie uma nova data de viagem para {selectedDestination?.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new_trip_departure_date">Data de Saída *</Label>
                      <Input
                        id="new_trip_departure_date"
                        type="date"
                        value={newTripForDestination.departure_date}
                        onChange={(e) => setNewTripForDestination({...newTripForDestination, departure_date: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new_trip_return_date">Data de Retorno *</Label>
                      <Input
                        id="new_trip_return_date"
                        type="date"
                        value={newTripForDestination.return_date}
                        onChange={(e) => setNewTripForDestination({...newTripForDestination, return_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new_trip_departure_time">Horário de Saída *</Label>
                      <Input
                        id="new_trip_departure_time"
                        type="time"
                        value={newTripForDestination.departure_time}
                        onChange={(e) => setNewTripForDestination({...newTripForDestination, departure_time: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new_trip_duration_hours">Duração (horas) *</Label>
                      <Input
                        id="new_trip_duration_hours"
                        type="number"
                        min="1"
                        max="168"
                        value={newTripForDestination.duration_hours}
                        onChange={(e) => setNewTripForDestination({...newTripForDestination, duration_hours: e.target.value})}
                        placeholder="24"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new_trip_price_individual">Preço Individual *</Label>
                      <Input
                        id="new_trip_price_individual"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTripForDestination.price_individual}
                        onChange={(e) => setNewTripForDestination({...newTripForDestination, price_individual: e.target.value})}
                        placeholder="150.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new_trip_price_couple">Preço Casal *</Label>
                      <Input
                        id="new_trip_price_couple"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTripForDestination.price_couple}
                        onChange={(e) => setNewTripForDestination({...newTripForDestination, price_couple: e.target.value})}
                        placeholder="280.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new_trip_price_group">Preço Grupo *</Label>
                      <Input
                        id="new_trip_price_group"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTripForDestination.price_group}
                        onChange={(e) => setNewTripForDestination({...newTripForDestination, price_group: e.target.value})}
                        placeholder="120.00"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="new_trip_bus_quantity">Quantidade de Ônibus *</Label>
                    <Input
                      id="new_trip_bus_quantity"
                      type="number"
                      min="1"
                      max="10"
                      value={newTripForDestination.bus_quantity}
                      onChange={(e) => setNewTripForDestination({...newTripForDestination, bus_quantity: e.target.value})}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddTripDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTripForDestination}>
                  Criar Data
                </Button>
              </div>
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

                 {/* Seção de Inclusões no Pacote */}
                 <div className="space-y-4">
                   <h4 className="font-semibold text-sm text-foreground">Opções de Inclusões no Pacote</h4>
                   <div className="space-y-3">
                     <div className="flex items-center space-x-3">
                       <input
                         type="checkbox"
                         id="includes_accommodation"
                         checked={editTripForm.includes_accommodation}
                         onChange={(e) => setEditTripForm({...editTripForm, includes_accommodation: e.target.checked})}
                         className="rounded border-gray-300 text-primary focus:ring-primary"
                       />
                       <Label htmlFor="includes_accommodation" className="text-sm font-normal">
                         Hospedagem inclusa (desmarque para viagens "bate e volta")
                       </Label>
                     </div>
                     <div className="flex items-center space-x-3">
                       <input
                         type="checkbox"
                         id="includes_breakfast"
                         checked={editTripForm.includes_breakfast}
                         onChange={(e) => setEditTripForm({...editTripForm, includes_breakfast: e.target.checked})}
                         className="rounded border-gray-300 text-primary focus:ring-primary"
                       />
                       <Label htmlFor="includes_breakfast" className="text-sm font-normal">
                         Café da manhã incluso
                       </Label>
                     </div>
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

        {/* Dialog para confirmar exclusão de viagem */}
        <Dialog open={isDeleteTripDialogOpen} onOpenChange={setIsDeleteTripDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-destructive">Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir esta data de viagem?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {deletingTrip && (
                <div className="space-y-2">
                  <p><strong>Data:</strong> {formatDate(deletingTrip.departure_date)} - {formatDate(deletingTrip.return_date)}</p>
                  <p><strong>Destino:</strong> {deletingTrip.destination.name}</p>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
                    <p className="text-sm text-destructive font-medium mb-2">⚠️ Esta ação não pode ser desfeita!</p>
                    <p className="text-sm text-muted-foreground">
                      Ao excluir esta data, todos os dados relacionados serão removidos permanentemente:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 ml-4 list-disc">
                      <li>Todas as reservas desta data</li>
                      <li>Todos os assentos dos ônibus</li>
                      <li>Todos os ônibus designados</li>
                      <li>Todos os pagamentos relacionados</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteTripDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteTrip}>
                <Trash2 className="h-4 w-4 mr-2" />
                Sim, Excluir Data
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
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              {selectedDestination.name}
            </h1>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddTripDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditDestination(selectedDestination)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar Destino
                </Button>
              </div>
            )}
          </div>
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
                    {trip.includes_breakfast && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Coffee className="h-3 w-3" />
                        <span>Café da manhã incluso</span>
                      </div>
                    )}
                    {trip.includes_accommodation && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bed className="h-3 w-3" />
                        <span>Hospedagem inclusa</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Duração: {trip.duration_hours}h {trip.duration_hours >= 24 ? `(${Math.floor(trip.duration_hours / 24)} dia${Math.floor(trip.duration_hours / 24) > 1 ? 's' : ''})` : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={`/checkout?trip_id=${trip.id}`} className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Reservar Esta Data
                    </Button>
                  </Link>
                  {isAdmin && trip.id && (
                    <div className="flex gap-1">
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteTrip(trip);
                        }}
                        className="px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Dialog para criar novo destino */}
      {isAdmin && (
        <Dialog open={isCreateDestinationDialogOpen} onOpenChange={setIsCreateDestinationDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Destino</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo destino.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="create_name">Nome *</Label>
                  <Input
                    id="create_name"
                    value={newDestination.name}
                    onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
                    placeholder="Ex: Fortaleza"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create_state">Estado *</Label>
                  <Input
                    id="create_state"
                    value={newDestination.state}
                    onChange={(e) => setNewDestination({...newDestination, state: e.target.value})}
                    placeholder="Ex: CE"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create_description">Descrição *</Label>
                  <Textarea
                    id="create_description"
                    value={newDestination.description}
                    onChange={(e) => setNewDestination({...newDestination, description: e.target.value})}
                    placeholder="Descreva o destino..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create_image_url">URL da Imagem</Label>
                  <Input
                    id="create_image_url"
                    value={newDestination.image_url}
                    onChange={(e) => setNewDestination({...newDestination, image_url: e.target.value})}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDestinationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateDestination}>
                Criar Destino
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Destinos Disponíveis</h1>
          <p className="text-muted-foreground">
            Escolha seu próximo destino para ver as datas disponíveis
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateDestinationDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Destino
          </Button>
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

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline">
                  Ver Datas Disponíveis
                  <Calendar className="h-4 w-4 ml-2" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDestination(destination);
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
