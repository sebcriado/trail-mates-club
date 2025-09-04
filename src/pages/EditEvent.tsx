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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  hiking_groups: {
    id: string;
    name: string;
  };
}

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [newEquipment, setNewEquipment] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

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

        // Check if user is the organizer
        if (user?.id !== data.organizer_id) {
          toast({
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à modifier cet événement",
            variant: "destructive",
          });
          navigate(`/events/${id}`);
          return;
        }

        setEvent(data);
        
        // Pre-fill form with event data
        setTitle(data.title);
        setDescription(data.description || "");
        setLocation(data.location);
        setStartDate(format(new Date(data.start_date), "yyyy-MM-dd'T'HH:mm"));
        setEndDate(data.end_date ? format(new Date(data.end_date), "yyyy-MM-dd'T'HH:mm") : "");
        setDifficultyLevel(data.difficulty_level || "");
        setMaxParticipants(data.max_participants || 10);
        setMeetingPoint(data.meeting_point || "");
        setEquipmentNeeded(data.equipment_needed || []);
        setIsPremium(data.is_premium || false);

      } catch (error) {
        console.error("Error fetching event:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'événement",
          variant: "destructive",
        });
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user, navigate, toast]);

  const addEquipment = () => {
    if (newEquipment.trim() && !equipmentNeeded.includes(newEquipment.trim())) {
      setEquipmentNeeded([...equipmentNeeded, newEquipment.trim()]);
      setNewEquipment("");
    }
  };

  const removeEquipment = (item: string) => {
    setEquipmentNeeded(equipmentNeeded.filter(eq => eq !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !user) return;

    // Validation
    if (!title.trim() || !location.trim() || !startDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim(),
        start_date: startDate,
        end_date: endDate || null,
        difficulty_level: difficultyLevel || null,
        max_participants: maxParticipants,
        meeting_point: meetingPoint.trim() || null,
        equipment_needed: equipmentNeeded.length > 0 ? equipmentNeeded : null,
        is_premium: isPremium,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("hiking_events")
        .update(eventData)
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'événement a été modifié avec succès !",
      });

      navigate(`/events/${event.id}`);
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'événement",
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/events/${event.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Modifier l'événement</h1>
            <p className="text-muted-foreground">
              Groupe : {event.hiking_groups.name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails de l'événement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'événement *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Randonnée au Mont Blanc"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre événement..."
                  rows={4}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Lieu *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Chamonix, France"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Meeting Point */}
              <div className="space-y-2">
                <Label htmlFor="meetingPoint">Point de rendez-vous</Label>
                <Input
                  id="meetingPoint"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="Ex: Parking de la télécabine"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date et heure de début *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Date et heure de fin</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Difficulty and Max Participants */}
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
                  <Label htmlFor="maxParticipants">Nombre max de participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-2">
                <Label>Équipement nécessaire</Label>
                <div className="flex gap-2">
                  <Input
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    placeholder="Ajouter un équipement..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEquipment();
                      }
                    }}
                  />
                  <Button type="button" onClick={addEquipment} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {equipmentNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {equipmentNeeded.map((item) => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeEquipment(item)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Premium Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="premium"
                  checked={isPremium}
                  onCheckedChange={setIsPremium}
                />
                <Label htmlFor="premium">Événement premium</Label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-forest hover:opacity-90"
                >
                  {saving ? "Modification..." : "Modifier l'événement"}
                </Button>
                <Link to={`/events/${event.id}`}>
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

export default EditEvent;
