import { Button } from "@/components/ui/button";
import { Mountain, Menu, User, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Mountain className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">HikingHub</span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/groups" className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth">
            Groupes
          </Link>
          <Link to="/events" className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth">
            Événements
          </Link>
          <a href="#premium" className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth">
            Premium
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full text-xs"></span>
              </Button>
              <Link to="/profile">
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm">
                Connexion
              </Button>
            </Link>
          )}
          
          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};