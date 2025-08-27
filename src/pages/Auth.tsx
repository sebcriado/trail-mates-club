import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mountain, ArrowLeft, Mail, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer votre adresse email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Erreur d'authentification",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setMagicLinkSent(true);
        toast({
          title: "Magic link envoyé !",
          description: "Vérifiez votre boîte email et cliquez sur le lien pour vous connecter.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-mountain flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-soft border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-success/10 rounded-full w-fit">
              <Check className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl text-foreground">Magic link envoyé !</CardTitle>
            <CardDescription className="text-muted-foreground">
              Nous avons envoyé un lien de connexion à <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Cliquez sur le lien dans votre email pour vous connecter automatiquement.</p>
              <p className="mt-2">Vous pouvez fermer cette page.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setMagicLinkSent(false)}
              className="w-full"
            >
              Renvoyer un lien
            </Button>
            <Link to="/">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mountain flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-soft border-border/50">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">HikeConnect</span>
          </div>
          <CardTitle className="text-2xl text-foreground">
            {isSignUp ? 'Créer un compte' : 'Se connecter'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Entrez votre email pour recevoir un lien de connexion magique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              variant="default"
            >
              {loading ? 'Envoi en cours...' : (isSignUp ? 'Créer le compte' : 'Envoyer le magic link')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:text-primary-light transition-smooth"
            >
              {isSignUp 
                ? 'Déjà un compte ? Se connecter' 
                : 'Pas encore de compte ? S\'inscrire'
              }
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-xs text-center text-muted-foreground">
            <p>En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;