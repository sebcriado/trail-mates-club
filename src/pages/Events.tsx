import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, MapPin, Users, Search, Clock, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface HikingEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date?: string;
  difficulty_level: string;
  max_participants: number;
  is_premium: boolean;
  group_id: string;
  organizer_id: string;
  hiking_groups: {
    name: string;
  };
}

const Events = () => {
  const [events, setEvents] = useState<HikingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("hiking_events")
        .select(`
          *,
          hiking_groups(name)
        `)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    
    if (endDate) {
      const end = new Date(endDate);
      if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
        // Same day
        return `${format(start, "d MMMM yyyy", { locale: fr })} de ${format(start, "HH:mm")} à ${format(end, "HH:mm")}`;
      } else {
        // Multiple days
        return `Du ${format(start, "d MMM", { locale: fr })} au ${format(end, "d MMM yyyy", { locale: fr })}`;
      }
    }
    
    return format(start, "d MMMM yyyy à HH:mm", { locale: fr });
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.hiking_groups.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "facile": return "bg-success text-success-foreground";
      case "modéré": return "bg-warning text-warning-foreground";
      case "difficile": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Chargement des événements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Événements de randonnée</h1>
            <p className="text-muted-foreground">Découvrez les prochaines randonnées organisées</p>
          </div>
          {user && (
            <Link to="/events/create">
              <Button className="bg-gradient-trail hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Créer un événement
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un événement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl text-foreground">{event.title}</CardTitle>
                  {event.is_premium && (
                    <Badge className="bg-gradient-trail text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <CardDescription>{event.description}</CardDescription>
                <div className="text-sm text-accent font-medium">
                  Groupe: {event.hiking_groups.name}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatEventDate(event.start_date, event.end_date)}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    Max {event.max_participants} participants
                  </div>
                  {event.difficulty_level && (
                    <Badge variant="secondary" className={getDifficultyColor(event.difficulty_level)}>
                      {event.difficulty_level}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter>
                <Link to={`/events/${event.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Voir détails
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucun événement trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Essayez d'autres termes de recherche" : "Aucun événement prévu pour le moment"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;