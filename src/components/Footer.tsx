import { Mountain, Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Mountain className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold">HikeConnect</span>
            </div>
            <p className="text-primary-foreground/80 mb-6 max-w-md">
              La plateforme communautaire qui connecte les passionnés de randonnée 
              pour des aventures inoubliables en groupe.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-accent" />
                <span>contact@hikeconnect.fr</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-accent" />
                <span>Partout en France</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">Groupes</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">Événements</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">Premium</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">À propos</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">Centre d'aide</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">Sécurité</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">Confidentialité</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">Conditions</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center">
          <p className="text-primary-foreground/60">
            © 2024 HikeConnect. Tous droits réservés. Fait avec ❤️ pour la communauté rando.
          </p>
        </div>
      </div>
    </footer>
  );
};