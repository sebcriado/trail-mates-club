import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, CalendarIcon, Plus, X } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { eventSchema } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { z } from "zod"

const CreateEvent = () => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        group_id: "",
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
        location: "",
        difficulty_level: "",
        max_participants: 15,
        meeting_point: "",
        equipment_needed: [] as string[],
        is_premium: false,
    })

    const [newEquipment, setNewEquipment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [groups, setGroups] = useState<{id: string, name: string}[]>([])
    const [loading, setLoading] = useState(false)
    
    const { user } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    // Charger les groupes dont l'utilisateur est propriétaire
    useEffect(() => {
        const loadUserGroups = async () => {
            if (!user) return

            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from("group_members")
                    .select(`
                        group_id,
                        role,
                        hiking_groups (
                            id,
                            name
                        )
                    `)
                    .eq("user_id", user.id)
                    .eq("role", "owner")

                if (error) throw error

                const userGroups = data.map(item => ({
                    id: item.hiking_groups.id,
                    name: item.hiking_groups.name
                }))

                setGroups(userGroups)
            } catch (error) {
                logger.error("Error loading groups:", error)
                toast({
                    title: "Erreur",
                    description: "Impossible de charger vos groupes",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        loadUserGroups()
    }, [user, toast])

    const handleInputChange = (field: string, value: string | number | boolean | Date | undefined) => {
        // Ne pas accepter les valeurs spéciales comme des sélections valides
        if (field === "group_id" && (value === "loading" || value === "no-groups")) {
            return
        }
        
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const addEquipment = () => {
        if (newEquipment.trim() && !formData.equipment_needed.includes(newEquipment.trim())) {
            setFormData(prev => ({
                ...prev,
                equipment_needed: [...prev.equipment_needed, newEquipment.trim()]
            }))
            setNewEquipment("")
        }
    }

    const removeEquipment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            equipment_needed: prev.equipment_needed.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            navigate("/auth")
            return
        }

        if (!formData.start_date) {
            toast({
                title: "Erreur",
                description: "Veuillez sélectionner une date de début",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            // Validate form data with Zod
            const validatedData = eventSchema.parse({
                title: formData.title,
                description: formData.description,
                location: formData.location,
                difficulty_level: formData.difficulty_level,
                max_participants: formData.max_participants,
                meeting_point: formData.meeting_point,
                is_premium: formData.is_premium,
            })

            const { data, error } = await supabase
                .from("hiking_events")
                .insert({
                    ...validatedData,
                    group_id: formData.group_id,
                    organizer_id: user.id,
                    start_date: formData.start_date.toISOString(),
                    end_date: formData.end_date?.toISOString() || null,
                    equipment_needed: formData.equipment_needed.length > 0 ? formData.equipment_needed : null,
                })
                .select()
                .single()

            if (error) throw error

            toast({
                title: "Succès",
                description: "Votre événement a été créé avec succès !",
            })

            navigate(`/events/${data.id}`)
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Handle validation errors
                const firstError = error.errors[0];
                toast({
                    title: "Erreur de validation",
                    description: firstError.message,
                    variant: "destructive",
                })
            } else {
                logger.error("Error creating event:", error)
                toast({
                    title: "Erreur",
                    description: "Impossible de créer l'événement",
                    variant: "destructive",
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Vérification d'authentification
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-muted-foreground">Vous devez être connecté pour créer un événement.</p>
                    <Link to="/auth">
                        <Button className="mt-4">Se connecter</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/events">
                    <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Créer un événement</h1>
                    <p className="text-muted-foreground">Rassemblez des passionnés de randonnée</p>
                </div>
            </div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Titre */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre de l'événement *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleInputChange("title", e.target.value)}
                                placeholder="Ex: Randonnée au Mont-Blanc"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                placeholder="Décrivez votre événement..."
                                rows={4}
                            />
                        </div>

                        {/* Groupe */}
                        <div className="space-y-2">
                            <Label htmlFor="group_id">Groupe *</Label>
                            <Select value={formData.group_id} onValueChange={(value) => handleInputChange("group_id", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un groupe" />
                                </SelectTrigger>
                                <SelectContent>
                                    {loading && (
                                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                    )}
                                    {!loading && groups.length === 0 && (
                                        <SelectItem value="no-groups" disabled>
                                            Vous devez être propriétaire d'un groupe pour créer un événement.
                                        </SelectItem>
                                    )}
                                    {!loading && groups.length > 0 && groups.map((group) => (
                                        <SelectItem key={group.id} value={group.id}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date de début *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.start_date ? (
                                                format(formData.start_date, "PPP", { locale: fr })
                                            ) : (
                                                <span>Choisir une date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.start_date}
                                            onSelect={(date) => handleInputChange("start_date", date)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Date de fin</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.end_date ? (
                                                format(formData.end_date, "PPP", { locale: fr })
                                            ) : (
                                                <span>Choisir une date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.end_date}
                                            onSelect={(date) => handleInputChange("end_date", date)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Lieu */}
                        <div className="space-y-2">
                            <Label htmlFor="location">Lieu *</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => handleInputChange("location", e.target.value)}
                                placeholder="Ex: Chamonix, France"
                                required
                            />
                        </div>

                        {/* Point de rendez-vous */}
                        <div className="space-y-2">
                            <Label htmlFor="meeting_point">Point de rendez-vous</Label>
                            <Input
                                id="meeting_point"
                                value={formData.meeting_point}
                                onChange={(e) => handleInputChange("meeting_point", e.target.value)}
                                placeholder="Ex: Parking de la télécabine"
                            />
                        </div>

                        {/* Niveau de difficulté */}
                        <div className="space-y-2">
                            <Label htmlFor="difficulty_level">Niveau de difficulté</Label>
                            <Select value={formData.difficulty_level} onValueChange={(value) => handleInputChange("difficulty_level", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un niveau" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Facile</SelectItem>
                                    <SelectItem value="moderate">Modéré</SelectItem>
                                    <SelectItem value="hard">Difficile</SelectItem>
                                    <SelectItem value="expert">Expert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nombre maximum de participants */}
                        <div className="space-y-2">
                            <Label htmlFor="max_participants">Nombre maximum de participants</Label>
                            <Input
                                id="max_participants"
                                type="number"
                                min="1"
                                max="50"
                                value={formData.max_participants}
                                onChange={(e) => handleInputChange("max_participants", parseInt(e.target.value) || 15)}
                            />
                        </div>

                        {/* Équipement nécessaire */}
                        <div className="space-y-2">
                            <Label>Équipement nécessaire</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newEquipment}
                                    onChange={(e) => setNewEquipment(e.target.value)}
                                    placeholder="Ex: Chaussures de randonnée"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            addEquipment()
                                        }
                                    }}
                                />
                                <Button type="button" onClick={addEquipment} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.equipment_needed.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.equipment_needed.map((item, index) => (
                                        <div key={`equipment-${item}-${index}`} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-sm">
                                            <span>{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeEquipment(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Événement premium */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_premium"
                                checked={formData.is_premium}
                                onCheckedChange={(checked) => handleInputChange("is_premium", checked)}
                            />
                            <Label htmlFor="is_premium">Événement premium</Label>
                        </div>

                        {/* Boutons */}
                        <div className="flex gap-4 pt-4">
                            <Link to="/events" className="flex-1">
                                <Button type="button" variant="outline" className="w-full">
                                    Annuler
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !formData.title || !formData.group_id || !formData.start_date || !formData.location}
                                className="flex-1 bg-gradient-forest hover:opacity-90"
                            >
                                {isSubmitting ? "Création..." : "Créer l'événement"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default CreateEvent