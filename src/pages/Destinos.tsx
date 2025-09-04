import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";

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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Destinos Disponíveis</h1>
        <p className="text-muted-foreground">
          Escolha seu próximo destino para ver as datas disponíveis
        </p>
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

