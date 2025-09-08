import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MapPin, Image, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  description: string;
  location: string;
  difficulty_level: string;
  max_members: number;
  is_private: boolean;
  cover_image_url: string | null;
  owner_id: string;
}

const EditGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [maxMembers, setMaxMembers] = useState(20);
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");

  useEffect(() => {
    const fetchGroup = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("hiking_groups")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        // Check if user is the owner
        if (user?.id !== data.owner_id) {
          toast({
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à modifier ce groupe",
            variant: "destructive",
          });
          navigate(`/groups/${id}`);
          return;
        }

        setGroup(data);
        
        // Pre-fill form with group data
        setName(data.name);
        setDescription(data.description || "");
        setLocation(data.location || "");
        setDifficultyLevel(data.difficulty_level || "");
        setMaxMembers(data.max_members || 20);
        setIsPrivate(data.is_private || false);
        setCoverImageUrl(data.cover_image_url || "");

      } catch (error) {
        console.error("Error fetching group:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le groupe",
          variant: "destructive",
        });
        navigate("/groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id, user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !user) return;

    // Validation
    if (!name.trim() || !description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const groupData = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim() || null,
        difficulty_level: difficultyLevel || null,
        max_members: maxMembers,
        is_private: isPrivate,
        cover_image_url: coverImageUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("hiking_groups")
        .update(groupData)
        .eq("id", group.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le groupe a été modifié avec succès !",
      });

      navigate(`/groups/${group.id}`);
    } catch (error) {
      console.error("Error updating group:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le groupe",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/groups/${group.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Modifier le groupe</h1>
            <p className="text-muted-foreground">
              Mettez à jour les informations de votre groupe
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails du groupe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom du groupe *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Randonneurs des Alpes"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre groupe, son style de randonnée..."
                  rows={4}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Région</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Haute-Savoie, France"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-2">
                <Label htmlFor="coverImage">URL de l'image de couverture</Label>
                <div className="relative">
                  <Image className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="coverImage"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://exemple.com/image.jpg"
                    className="pl-10"
                    type="url"
                  />
                </div>
                {coverImageUrl && (
                  <div className="mt-2">
                    <img
                      src={coverImageUrl}
                      alt="Aperçu"
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Difficulty and Max Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Niveau de difficulté</Label>
                  <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="moderate">Modéré</SelectItem>
                      <SelectItem value="hard">Difficile</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Nombre max de membres</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="maxMembers"
                      type="number"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(parseInt(e.target.value) || 20)}
                      min="2"
                      max="500"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Private Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="private">Groupe privé</Label>
                <p className="text-sm text-muted-foreground ml-2">
                  Les groupes privés nécessitent une invitation pour rejoindre
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-forest hover:opacity-90"
                >
                  {saving ? "Modification..." : "Modifier le groupe"}
                </Button>
                <Link to={`/groups/${group.id}`}>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditGroup;
