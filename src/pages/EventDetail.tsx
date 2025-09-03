import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MapPin, Calendar, Settings, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description: string;
  group_id: string;
  organizer_id: string;
  start_date: string;
  end_date: string | null;
  location: string;
  difficulty_level: string;
  max_participants: number;
  meeting_point: string | null;
  equipment_needed: string[] | null;
  is_premium: boolean;
  created_at: string;
  hiking_groups: {
    id: string;
    name: string;
  };
}

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("hiking_events")
          .select(`
            *,
            hiking_groups (
              id,
              name
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setEvent(data);

        // Check if current user is a member of the group
        if (user && data.group_id) {
          const { data: memberData } = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", data.group_id)
            .eq("user_id", user.id)
            .single();

          setIsMember(!!memberData);
        }

        // Check if current user is a participant
        if (user) {
          const { data: participantData } = await supabase
            .from("event_participants")
            .select("id")
            .eq("event_id", id)
            .eq("user_id", user.id)
            .single();

          setIsParticipant(!!participantData);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'événement",
          variant: "destructive",
        });
      }
    };

    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from("event_participants")
          .select(`
            id,
            user_id,
            joined_at
          `)
          .eq("event_id", id);

        if (error) throw error;

        // Fetch profiles separately to avoid relation issues
        const participantProfiles = await Promise.all(
          (data || []).map(async (participant) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", participant.user_id)
              .single();

            return {
              ...participant,
              profiles: profile || { full_name: "Utilisateur", avatar_url: null }
            };
          })
        );

        setParticipants(participantProfiles);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEventDetails();
      fetchParticipants();
    }
  }, [id, user, toast]);

  const joinEvent = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("event_participants")
        .insert({
          event_id: id,
          user_id: user.id,
        });

      if (error) throw error;

      setIsParticipant(true);
      // Refetch participants to update the list
      fetchParticipants();
      toast({
        title: "Succès",
        description: "Vous participez maintenant à cet événement !",
      });
    } catch (error) {
      console.error("Error joining event:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejoindre l'événement",
        variant: "destructive",
      });
    }
  };

  const leaveEvent = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setIsParticipant(false);
      // Refetch participants to update the list
      fetchParticipants();
      toast({
        title: "Succès",
        description: "Vous ne participez plus à cet événement",
      });
    } catch (error) {
      console.error("Error leaving event:", error);
      toast({
        title: "Erreur",
        description: "Impossible de quitter l'événement",
        variant: "destructive",
      });
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select(`
          id,
          user_id,
          joined_at
        `)
        .eq("event_id", id);

      if (error) throw error;

      // Fetch profiles separately to avoid relation issues
      const participantProfiles = await Promise.all(
        (data || []).map(async (participant) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", participant.user_id)
            .single();

          return {
            ...participant,
            profiles: profile || { full_name: "Utilisateur", avatar_url: null }
          };
        })
      );

      setParticipants(participantProfiles);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const getDifficultyLabel = (level: string) => {
    const labels = {
      easy: "Facile",
      moderate: "Modéré",
      hard: "Difficile",
      expert: "Expert"
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getDifficultyColor = (level: string) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800",
      hard: "bg-orange-100 text-orange-800",
      expert: "bg-red-100 text-red-800"
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "PPP 'à' HH:mm", { locale: fr });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Événement non trouvé</p>
            <Link to="/events">
              <Button className="mt-4">Retour aux événements</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.id === event.organizer_id;
  const eventDate = new Date(event.start_date);
  const isPastEvent = eventDate < new Date();
  const spotsLeft = event.max_participants - participants.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/events">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
            <p className="text-muted-foreground">
              Organisé par le groupe {event.hiking_groups.name}
            </p>
          </div>
          {isOrganizer && (
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Status */}
            <div className="flex gap-2">
              {isPastEvent && (
                <Badge variant="secondary">Événement passé</Badge>
              )}
              {event.is_premium && (
                <Badge className="bg-amber-100 text-amber-800">Premium</Badge>
              )}
              {spotsLeft === 0 && !isPastEvent && (
                <Badge variant="destructive">Complet</Badge>
              )}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description || "Aucune description disponible"}
                </p>
              </CardContent>
            </Card>

            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de l'événement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Début : {formatDateTime(event.start_date)}</p>
                    {event.end_date && (
                      <p className="text-sm text-muted-foreground">
                        Fin : {formatDateTime(event.end_date)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>

                {event.meeting_point && (
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <span>Point de rendez-vous : {event.meeting_point}</span>
                  </div>
                )}

                {event.difficulty_level && (
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(event.difficulty_level)}>
                      {getDifficultyLabel(event.difficulty_level)}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {participants.length} / {event.max_participants} participants
                    {spotsLeft > 0 && !isPastEvent && (
                      <span className="text-green-600 ml-2">
                        ({spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''})
                      </span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Equipment */}
            {event.equipment_needed && event.equipment_needed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Équipement nécessaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {event.equipment_needed.map((item) => (
                      <li key={`equipment-${item}`} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join/Leave Button */}
            {user && !isOrganizer && isMember && !isPastEvent && (
              <Card>
                <CardContent className="pt-6">
                  {isParticipant ? (
                    <Button 
                      onClick={leaveEvent}
                      variant="outline" 
                      className="w-full"
                    >
                      Annuler ma participation
                    </Button>
                  ) : (
                    <>
                      {spotsLeft > 0 ? (
                        <Button 
                          onClick={joinEvent}
                          className="w-full bg-gradient-forest hover:opacity-90"
                        >
                          Participer
                        </Button>
                      ) : (
                        <Button disabled className="w-full">
                          Événement complet
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Not a member warning */}
            {user && !isMember && !isOrganizer && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Vous devez être membre du groupe "{event.hiking_groups.name}" pour participer à cet événement.
                  </p>
                  <Link to={`/groups/${event.group_id}`}>
                    <Button variant="outline" className="w-full">
                      Voir le groupe
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Organizer info */}
            {isOrganizer && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-green-600 mb-4">
                    Vous êtes l'organisateur de cet événement
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    Gérer l'événement
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Participants ({participants.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {participant.profiles?.avatar_url ? (
                          <img
                            src={participant.profiles.avatar_url}
                            alt={participant.profiles?.full_name || "Participant"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {(participant.profiles?.full_name || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {participant.profiles?.full_name || "Utilisateur"}
                        </p>
                        {participant.user_id === event.organizer_id && (
                          <Badge variant="secondary" className="text-xs">
                            Organisateur
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {participants.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun participant pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Group Link */}
            <Card>
              <CardContent className="pt-6">
                <Link to={`/groups/${event.group_id}`}>
                  <Button variant="outline" className="w-full">
                    Voir le groupe {event.hiking_groups.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Event Details Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créé le :</span>
                  <span>{format(new Date(event.created_at), "PPP", { locale: fr })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut :</span>
                  <span className={isPastEvent ? "text-red-600" : "text-green-600"}>
                    {isPastEvent ? "Terminé" : "À venir"}
                  </span>
                </div>
                {event.is_premium && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type :</span>
                    <Badge className="bg-amber-100 text-amber-800">Premium</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
