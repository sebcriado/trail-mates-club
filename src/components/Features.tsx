import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Crown, Shield, Trophy, Calendar1Icon } from "lucide-react";
import groupIcon from "@/assets/group-icon.png";
import eventIcon from "@/assets/event-icon.png";
import { Link } from "react-router-dom";

export const Features = () => {
  return (
    <section className="py-20 bg-gradient-mountain">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tout ce dont vous avez besoin pour randonner en groupe
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            De la création de groupes à l'organisation d'événements, 
            HikeConnect vous accompagne à chaque étape de vos aventures.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-card/80 backdrop-blur border-border/50 shadow-medium flex flex-col h-full">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <img src={groupIcon} alt="Groupes" className="w-10 h-10" />
              </div>
              <CardTitle className="text-xl text-foreground">Créez vos groupes</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col flex-1">
              <p className="text-muted-foreground mb-6 flex-1">
                Formez des groupes avec des randonneurs qui partagent vos passions. 
                Définissez le niveau, la région et l'ambiance de vos sorties.
              </p>
              <Link to="/groups/create">
                <Button variant="forest" className="w-full mt-auto">
                  <Users className="mr-2 h-4 w-4" />
                  Créer un groupe
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-border/50 shadow-medium flex flex-col h-full">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <img src={eventIcon} alt="Événements" className="w-10 h-10" />
              </div>
              <CardTitle className="text-xl text-foreground">Organisez des événements</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col flex-1">
              <p className="text-muted-foreground mb-6 flex-1">
                Planifiez vos randonnées, partagez les détails et gérez les inscriptions. 
                Tout est simplifié pour vous concentrer sur l'aventure.
              </p>
              <Link to="/events/create">
                <Button variant="trail" className="w-full mt-auto">
                  <Calendar className="mr-2 h-4 w-4" />
                  Créer un événement
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Premium Features */}
        <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 text-center text-white shadow-glow">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-accent" />
              <span className="text-accent font-semibold">PREMIUM</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Débloquez tout le potentiel de HikingHub
            </h3>
            <p className="text-lg text-white/90 mb-8">
              Accédez à des fonctionnalités avancées pour une expérience de randonnée incomparable.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center">
                <Calendar1Icon className="h-8 w-8 text-accent mb-3" />
                <h4 className="font-semibold mb-2">Évènements premium</h4>
                <p className="text-sm text-white/80">Accès à des événements exclusifs et à des randonnées guidées</p>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="h-8 w-8 text-accent mb-3" />
                <h4 className="font-semibold mb-2">Sécurité renforcée</h4>
                <p className="text-sm text-white/80">Partage de position en temps réel et alertes d'urgence</p>
              </div>
              <div className="flex flex-col items-center">
                <Trophy className="h-8 w-8 text-accent mb-3" />
                <h4 className="font-semibold mb-2">Défis exclusifs</h4>
                <p className="text-sm text-white/80">Participez à des défis et gagnez des badges</p>
              </div>
            </div>

            <Button variant="trail" size="lg" className="bg-white text-primary hover:bg-white/90">
              Passer à Premium - 9,99€/mois
              <Crown className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};