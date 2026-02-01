import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, MapPin, Calendar, Users, Trophy, Settings, Crown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { profileSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { usePremium } from "@/contexts/PremiumContext";
import { Link } from "react-router-dom";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  hiking_experience: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  groupsCount: number;
  eventsCount: number;
  participationsCount: number;
}

const Profile = () => {
  const { user } = useAuth();
  const { isPremium, subscription } = usePremium();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    groupsCount: 0,
    eventsCount: 0,
    participationsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    hiking_experience: "beginner"
  });

  useEffect(() => {
    const createDefaultProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            full_name: user.email?.split('@')[0] || "Utilisateur",
            bio: null,
            location: null,
            hiking_experience: "beginner"
          })
          .select()
          .single();

        if (error) throw error;

        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          bio: data.bio || "",
          location: data.location || "",
          hiking_experience: data.hiking_experience || "beginner"
        });
      } catch (error) {
        logger.error("Error creating profile:", error);
      }
    };

    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setProfile(data);
          setFormData({
            full_name: data.full_name || "",
            bio: data.bio || "",
            location: data.location || "",
            hiking_experience: data.hiking_experience || "beginner"
          });
        } else {
          // Créer un profil par défaut si il n'existe pas
          await createDefaultProfile();
        }
      } catch (error) {
        logger.error("Error fetching profile:", error);
        toast.error("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserStats = async () => {
      if (!user) return;

      try {
        // Compter les groupes dont l'utilisateur est propriétaire
        const { count: groupsCount } = await supabase
          .from("hiking_groups")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id);

        // Compter les événements organisés par l'utilisateur
        const { count: eventsCount } = await supabase
          .from("hiking_events")
          .select("*", { count: "exact", head: true })
          .eq("organizer_id", user.id);

        // Compter les participations aux événements
        const { count: participationsCount } = await supabase
          .from("event_participants")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setUserStats({
          groupsCount: groupsCount || 0,
          eventsCount: eventsCount || 0,
          participationsCount: participationsCount || 0
        });
      } catch (error) {
        logger.error("Error fetching user stats:", error);
      }
    };

    const loadData = async () => {
      if (user) {
        await fetchProfile();
        await fetchUserStats();
      }
    };
    
    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);

    try {
      // Validate form data with Zod
      const validatedData = profileSchema.parse(formData);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validatedData.full_name,
          bio: validatedData.bio,
          location: validatedData.location,
          hiking_experience: validatedData.hiking_experience,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        ...validatedData,
        updated_at: new Date().toISOString()
      });

      setIsEditing(false);
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        logger.error("Error updating profile:", error);
        toast.error("Erreur lors de la mise à jour du profil");
      }
    } finally {
      setSaving(false);
    }
  };

  const getExperienceLabel = (level: string) => {
    const labels = {
      beginner: "Débutant",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
      expert: "Expert"
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getExperienceColor = (level: string) => {
    const colors = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-blue-100 text-blue-800",
      advanced: "bg-orange-100 text-orange-800",
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Erreur lors du chargement du profil</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 max-w-4xl">
        {/* Header du profil */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-shrink-0">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {(profile.full_name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-2 right-2 rounded-full w-8 h-8"
                onClick={() => setIsEditing(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {profile.full_name || "Utilisateur"}
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
                {profile.location && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Membre depuis {format(new Date(profile.created_at), "MMMM yyyy", { locale: fr })}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {isPremium && (
                  <Badge className="bg-gradient-trail text-white border-none">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {profile.hiking_experience && (
                  <Badge className={getExperienceColor(profile.hiking_experience)}>
                    {getExperienceLabel(profile.hiking_experience)}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {isEditing ? "Annuler" : "Modifier"}
                </Button>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-4 text-muted-foreground">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.groupsCount}</p>
                  <p className="text-sm text-muted-foreground">Groupes créés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.eventsCount}</p>
                  <p className="text-sm text-muted-foreground">Événements organisés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.participationsCount}</p>
                  <p className="text-sm text-muted-foreground">Participations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="edit" disabled={!isEditing}>Modifier le profil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Nom complet</Label>
                    <p className="text-muted-foreground">{profile.full_name || "Non renseigné"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Localisation</Label>
                    <p className="text-muted-foreground">{profile.location || "Non renseignée"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Niveau d'expérience</Label>
                    <div className="mt-1">
                      {profile.hiking_experience && (
                        <Badge className={getExperienceColor(profile.hiking_experience)}>
                          {getExperienceLabel(profile.hiking_experience)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Biographie</Label>
                    <p className="text-muted-foreground">{profile.bio || "Aucune biographie"}</p>
                  </div>
                  {isPremium && subscription && (
                    <div>
                      <Label className="text-sm font-medium">Abonnement</Label>
                      <div className="mt-2 p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="h-4 w-4 text-accent" />
                          <span className="font-semibold text-accent">Premium actif</span>
                        </div>
                        {subscription.current_period_end && (
                          <p className="text-xs text-muted-foreground">
                            Renouvellement le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                        <Link to="/pricing" className="text-xs text-accent hover:underline mt-1 inline-block">
                          Gérer mon abonnement →
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Aucune activité récente à afficher
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Modifier le profil</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nom complet</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Votre nom complet"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Localisation</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Votre ville ou région"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hiking_experience">Niveau d'expérience en randonnée</Label>
                    <select
                      id="hiking_experience"
                      value={formData.hiking_experience}
                      onChange={(e) => setFormData({ ...formData, hiking_experience: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="beginner">Débutant</option>
                      <option value="intermediate">Intermédiaire</option>
                      <option value="advanced">Avancé</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="bio">Biographie</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Parlez-nous de vous, de votre passion pour la randonnée..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
