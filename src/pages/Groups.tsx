import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Users, MapPin, Search, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface HikingGroup {
  id: string;
  name: string;
  description: string;
  location: string;
  difficulty_level: string;
  cover_image_url: string;
  max_members: number;
  is_private: boolean;
  owner_id: string;
  member_count?: number;
}

const Groups = () => {
  const [groups, setGroups] = useState<HikingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("hiking_groups")
        .select(`
          *,
          group_members(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const groupsWithMemberCount = data?.map(group => ({
        ...group,
        member_count: Array.isArray(group.group_members) ? group.group_members.length : 0
      })) || [];

      setGroups(groupsWithMemberCount);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les groupes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Information",
            description: "Vous êtes déjà membre de ce groupe",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Succès",
          description: "Vous avez rejoint le groupe !",
        });
        fetchGroups();
      }
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejoindre le groupe",
        variant: "destructive",
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.location?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="text-center">Chargement des groupes...</div>
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
            <h1 className="text-3xl font-bold text-foreground">Groupes de randonnée</h1>
            <p className="text-muted-foreground">Découvrez et rejoignez des groupes près de chez vous</p>
          </div>
          {user && (
            <Link to="/groups/create">
              <Button className="bg-gradient-forest hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Créer un groupe
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-medium transition-all duration-300">
              <CardHeader className="p-0">
                <div className="h-48 bg-gradient-mountain rounded-t-lg relative overflow-hidden">
                  {group.cover_image_url ? (
                    <img 
                      src={group.cover_image_url} 
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-mountain flex items-center justify-center">
                      <Users className="h-16 w-16 text-primary opacity-50" />
                    </div>
                  )}
                  {group.is_private && (
                    <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
                      Privé
                    </Badge>
                  )}
                </div>
                <div className="p-6 pb-2">
                  <CardTitle className="text-xl text-foreground">{group.name}</CardTitle>
                  <CardDescription className="mt-2">{group.description}</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-2">
                <div className="space-y-2">
                  {group.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {group.location}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {group.member_count}/{group.max_members} membres
                    </div>
                    {group.difficulty_level && (
                      <Badge variant="secondary" className={getDifficultyColor(group.difficulty_level)}>
                        {group.difficulty_level}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-6 pt-2">
                <div className="flex gap-2 w-full">
                  <Link to={`/groups/${group.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Voir détails
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => joinGroup(group.id)}
                    className="bg-gradient-forest hover:opacity-90"
                  >
                    Rejoindre
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucun groupe trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Essayez d'autres termes de recherche" : "Soyez le premier à créer un groupe !"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;