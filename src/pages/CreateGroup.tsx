import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { groupSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { PremiumLimitAlert } from "@/components/PremiumLimitAlert";

const CreateGroup = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    max_members: 20,
    is_private: false,
    cover_image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canCreateGroup, ownedGroupsCount, maxGroups, isLoading: limitsLoading } = usePremiumLimits();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Validate form data with Zod
      const validatedData = groupSchema.parse(formData);

      const { data, error } = await supabase
        .from("hiking_groups")
        .insert({
          ...validatedData,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) {
        // Si l'erreur est liée à la policy RLS de limite
        if (error.message?.includes('violates row-level security policy') || error.code === '42501') {
          toast({
            title: "Limite atteinte",
            description: "Vous avez atteint la limite de groupes pour votre compte gratuit. Passez à Premium pour créer des groupes illimités.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Auto-join the creator to the group
      await supabase
        .from("group_members")
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: "owner",
        });

      toast({
        title: "Succès",
        description: "Votre groupe a été créé avec succès !",
      });

      navigate(`/groups/${data.id}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const firstError = error.errors[0];
        toast({
          title: "Erreur de validation",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        logger.error("Error creating group:", error);
        toast({
          title: "Erreur",
          description: "Impossible de créer le groupe",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Vous devez être connecté pour créer un groupe.</p>
            <Link to="/auth">
              <Button className="mt-4">Se connecter</Button>
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
          <Link to="/groups">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Créer un groupe</h1>
            <p className="text-muted-foreground">Rassemblez des passionnés de randonnée</p>
          </div>
        </div>

        {/* Premium Limit Alert */}
        {!canCreateGroup && !limitsLoading && (
          <div className="mb-6">
            <PremiumLimitAlert
              type="group"
              currentCount={ownedGroupsCount}
              maxCount={maxGroups}
            />
          </div>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du groupe</CardTitle>
            <CardDescription>
              Remplissez les détails pour créer votre nouveau groupe de randonnée
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du groupe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: Randonneurs des Alpes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Décrivez votre groupe, ses objectifs, son ambiance..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Région</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Ex: Haute-Savoie, France"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_members">Nombre maximum de membres</Label>
                  <Input
                    id="max_members"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.max_members}
                    onChange={(e) => handleInputChange("max_members", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover_image">URL de l'image de couverture (optionnel)</Label>
                <Input
                  id="cover_image"
                  type="url"
                  value={formData.cover_image_url}
                  onChange={(e) => handleInputChange("cover_image_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="private">Groupe privé</Label>
                  <p className="text-sm text-muted-foreground">
                    Les groupes privés nécessitent une invitation pour rejoindre
                  </p>
                </div>
                <Switch
                  id="private"
                  checked={formData.is_private}
                  onCheckedChange={(checked) => handleInputChange("is_private", checked)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Link to="/groups" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading || !formData.name || !canCreateGroup}
                  className="flex-1 bg-gradient-forest hover:opacity-90"
                >
                  {loading ? "Création..." : "Créer le groupe"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateGroup;