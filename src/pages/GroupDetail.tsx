import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MapPin, Calendar, Plus, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from "@/lib/logger";

interface Group {
  id: string;
  name: string;
  description: string;
  location: string;
  difficulty_level: string;
  max_members: number;
  is_private: boolean;
  cover_image_url: string;
  owner_id: string;
  created_at: string;
}

interface Member {
  id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  location: string;
  difficulty_level: string;
  max_participants: number;
  is_premium: boolean;
  organizer_id: string;
}

const GroupDetail = () => {
  const { id } = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("hiking_groups")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setGroup(data);

        // Check if current user is a member
        if (user) {
          const { data: memberData } = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", id)
            .eq("user_id", user.id)
            .single();

          setIsMember(!!memberData);
        }
      } catch (error) {
        logger.error("Error fetching group:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le groupe",
          variant: "destructive",
        });
      }
    };

    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("group_members")
          .select(`
            id,
            role,
            joined_at,
            user_id
          `)
          .eq("group_id", id);

        if (error) throw error;

        // Fetch profiles separately to avoid relation issues
        const memberProfiles = await Promise.all(
          (data || []).map(async (member) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", member.user_id)
              .single();

            return {
              ...member,
              profiles: profile || { full_name: "Utilisateur", avatar_url: null }
            };
          })
        );

        setMembers(memberProfiles);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("hiking_events")
          .select("*")
          .eq("group_id", id)
          .gte("start_date", new Date().toISOString())
          .order("start_date", { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        logger.error("Error fetching events:", error);
      }
    };

    if (id) {
      fetchGroupDetails();
      fetchMembers();
      fetchEvents();
    }
  }, [id, user, toast]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          id,
          role,
          joined_at,
          user_id
        `)
        .eq("group_id", id);

      if (error) throw error;

      // Fetch profiles separately to avoid relation issues
      const memberProfiles = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", member.user_id)
            .single();

          return {
            ...member,
            profiles: profile || { full_name: "Utilisateur", avatar_url: null }
          };
        })
      );

      setMembers(memberProfiles);
    } catch (error) {
      logger.error("Error fetching members:", error);
    }
  };

  const joinGroup = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: id,
          user_id: user.id,
          role: "member",
        });

      if (error) throw error;

      setIsMember(true);
      fetchMembers();
      toast({
        title: "Succès",
        description: "Vous avez rejoint le groupe !",
      });
    } catch (error) {
      logger.error("Error joining group:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejoindre le groupe",
        variant: "destructive",
      });
    }
  };

  const leaveGroup = async () => {
    if (!user) return;

    // Confirmation dialog for critical action
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir quitter ce groupe ? Vous devrez demander à le rejoindre à nouveau."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setIsMember(false);
      fetchMembers();
      toast({
        title: "Succès",
        description: "Vous avez quitté le groupe",
      });
    } catch (error) {
      logger.error("Error leaving group:", error);
      toast({
        title: "Erreur",
        description: "Impossible de quitter le groupe",
        variant: "destructive",
      });
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

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Groupe non trouvé</p>
            <Link to="/groups">
              <Button className="mt-4">Retour aux groupes</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === group.owner_id;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/groups">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
            <p className="text-muted-foreground">Créé le {new Date(group.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            {group.cover_image_url && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={group.cover_image_url}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {group.description || "Aucune description disponible"}
                </p>
              </CardContent>
            </Card>

            {/* Group Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du groupe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{group.location || "Localisation non spécifiée"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{members.length} / {group.max_members} membres</span>
                </div>

                {group.is_private && (
                  <Badge variant="secondary">Groupe privé</Badge>
                )}
              </CardContent>
            </Card>

            {/* Group Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Événements à venir ({events.length})</CardTitle>
                  {isOwner && (
                    <Link to="/events/create">
                      <Button size="sm" className="bg-gradient-forest hover:opacity-90">
                        <Plus className="h-4 w-4 mr-1" />
                        Créer
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          {event.is_premium && (
                            <Badge className="bg-amber-100 text-amber-800">Premium</Badge>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.start_date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Max {event.max_participants}
                          </div>
                        </div>

                        {event.difficulty_level && (
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={getDifficultyColor(event.difficulty_level)}>
                              {getDifficultyLabel(event.difficulty_level)}
                            </Badge>
                          </div>
                        )}

                        <Link to={`/events/${event.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            Voir les détails
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                      Aucun événement prévu pour ce groupe
                    </p>
                    {isOwner && (
                      <Link to="/events/create">
                        <Button className="bg-gradient-forest hover:opacity-90">
                          Créer le premier événement
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join/Leave Button */}
            {user && !isOwner && (
              <Card>
                <CardContent className="pt-6">
                  {isMember ? (
                    <Button 
                      onClick={leaveGroup}
                      variant="outline" 
                      className="w-full"
                    >
                      Quitter le groupe
                    </Button>
                  ) : (
                    <Button 
                      onClick={joinGroup}
                      className="w-full bg-gradient-forest hover:opacity-90"
                    >
                      Rejoindre le groupe
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Owner info */}
            {isOwner && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-green-600 mb-4">
                    Vous êtes le propriétaire de ce groupe
                  </p>
                  <Link to={`/groups/${group.id}/edit`}>
                    <Button variant="outline" className="w-full">
                      Modifier le groupe
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Members */}
            <Card>
              <CardHeader>
                <CardTitle>Membres ({members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {member.profiles?.avatar_url ? (
                          <img
                            src={member.profiles.avatar_url}
                            alt={member.profiles?.full_name || "Membre"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {(member.profiles?.full_name || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {member.profiles?.full_name || "Utilisateur"}
                        </p>
                        {member.role === "owner" && (
                          <Badge variant="secondary" className="text-xs">
                            Propriétaire
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;