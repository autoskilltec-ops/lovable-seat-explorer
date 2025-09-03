import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Destinos Disponíveis</h1>
        <p className="text-muted-foreground">
          Escolha seu próximo destino e faça sua reserva
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 overflow-hidden">
              <img
                src={trip.destination.image_url || "/placeholder.svg"}
                alt={trip.destination.name}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-4 right-4 bg-primary">
                {trip.destination.state}
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {trip.destination.name}
              </CardTitle>
              <CardDescription>
                {trip.destination.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(trip.departure_date)} - {formatDate(trip.return_date)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Individual
                  </span>
                  <span className="font-semibold">
                    {formatPrice(trip.price_individual)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Casal
                  </span>
                  <span className="font-semibold">
                    {formatPrice(trip.price_couple)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Grupo (4+)
                  </span>
                  <span className="font-semibold">
                    {formatPrice(trip.price_group)}
                  </span>
                </div>
              </div>

              <Link to={`/checkout?trip_id=${trip.id}`} className="block w-full">
                <Button className="w-full">
                  Fazer Reserva
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">
            Nenhuma viagem disponível
          </h3>
          <p className="text-muted-foreground">
            Novas viagens serão adicionadas em breve.
          </p>
        </div>
      )}
    </div>
  );
}

