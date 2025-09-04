import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MapPin, Star } from "lucide-react";
import heroImage from "@/assets/hero-mountain.jpg";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Hero = () => {
  const { user } = useAuth();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Connectez-vous avec la
            <span className="block bg-gradient-trail bg-clip-text text-transparent">
              communauté rando
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Rejoignez des groupes de randonneurs passionnés, participez à des événements 
            extraordinaires et explorez les plus beaux sentiers en bonne compagnie.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {!user && (
              <Link to="/auth">
                <Button variant="hero" size="lg" className="text-lg px-8">
                  Rejoindre la communauté
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link to="/groups">
              <Button variant="outline" size="lg" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                Découvrir les groupes
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-3">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-white">2,500+</div>
              <div className="text-sm text-white/70">Randonneurs actifs</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-3">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-white">150+</div>
              <div className="text-sm text-white/70">Sentiers explorés</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-3">
                <Star className="h-6 w-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-white">4.9/5</div>
              <div className="text-sm text-white/70">Note communauté</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};