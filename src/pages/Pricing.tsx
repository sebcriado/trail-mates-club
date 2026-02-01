import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { usePremium } from "@/contexts/PremiumContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isPremium, subscription } = usePremium();
  const { ownedGroupsCount, eventsThisYearCount, maxGroups, maxEventsPerYear, isLoading: limitsLoading } = usePremiumLimits();

  // Gérer les paramètres de retour de Lemonsqueezy
  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");

    if (success === "true") {
      toast({
        title: "Paiement réussi !",
        description: "Votre abonnement Premium est en cours d'activation. Vous recevrez un email de confirmation.",
      });
      // Nettoyer les paramètres de l'URL
      searchParams.delete("success");
      setSearchParams(searchParams);
    }

    if (cancelled === "true") {
      toast({
        title: "Paiement annulé",
        description: "Votre paiement a été annulé. Vous pouvez réessayer à tout moment.",
        variant: "destructive",
      });
      // Nettoyer les paramètres de l'URL
      searchParams.delete("cancelled");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, toast]);

  const CHECKOUT_URL = import.meta.env.VITE_LEMONSQUEEZY_CHECKOUT_URL || "";

  const handleSubscribe = () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!CHECKOUT_URL) {
      toast({
        title: "Configuration manquante",
        description: "L'URL de checkout Lemonsqueezy n'est pas configurée.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Construire l'URL avec les custom data et les URLs de retour
    const checkoutWithParams = new URL(CHECKOUT_URL);

    // Custom data pour identifier l'utilisateur dans le webhook
    checkoutWithParams.searchParams.set("checkout[custom][user_id]", user.id);

    // Email pré-rempli
    checkoutWithParams.searchParams.set("checkout[email]", user.email || "");

    // URLs de redirection après paiement (paramètres standards Lemonsqueezy)
    const currentUrl = window.location.origin;
    checkoutWithParams.searchParams.set("checkout[success_url]", `${currentUrl}/pricing?success=true`);

    // Rediriger vers Lemonsqueezy Checkout
    window.location.href = checkoutWithParams.toString();
  };

  const freeFeatures = [
    "Rejoindre des groupes publics",
    "Participer aux événements",
    "Créer 1 groupe",
    "10 événements par an",
    "Messagerie de groupe basique",
  ];

  const premiumFeatures = [
    "Tout du plan Gratuit",
    "Groupes illimités",
    "Événements illimités",
    "Badge Premium sur votre profil",
    "Statistiques avancées",
    "Support prioritaire",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            <Crown className="h-3 w-3 mr-1" />
            Tarifs
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Profitez de HikingHub gratuitement ou passez à Premium pour une expérience complète
          </p>
        </div>

        {/* Premium Status Alert */}
        {user && isPremium && subscription && (
          <Alert className="max-w-4xl mx-auto mb-8 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">Abonnement Premium actif</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              Vous profitez de tous les avantages Premium.
              {subscription.current_period_end && (
                <span className="ml-1">
                  Renouvellement le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Stats for logged in users - uniquement si l'utilisateur a créé au moins 1 groupe ou événement */}
        {user && !isPremium && !limitsLoading && (ownedGroupsCount > 0 || eventsThisYearCount > 0) && (
          <Alert className="max-w-4xl mx-auto mb-8 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900">
            <AlertDescription className="text-center">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Votre utilisation actuelle : <strong>{ownedGroupsCount}/{maxGroups === Infinity ? '∞' : maxGroups} groupe(s)</strong> créé(s) • <strong>{eventsThisYearCount}/{maxEventsPerYear === Infinity ? '∞' : maxEventsPerYear} événement(s)</strong> cette année
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Gratuit</CardTitle>
              <CardDescription>Pour découvrir la communauté</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate("/groups")}>
                Commencer gratuitement
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-accent shadow-glow">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-trail text-white">
                <Crown className="h-3 w-3 mr-1" />
                Populaire
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Premium
                <Crown className="h-5 w-5 text-accent" />
              </CardTitle>
              <CardDescription>Pour les randonneurs passionnés</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">5,99€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isPremium ? (
                <div className="w-full space-y-2">
                  <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Abonnement actif
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Gérez votre abonnement depuis votre email Lemonsqueezy
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-trail hover:opacity-90"
                  onClick={handleSubscribe}
                  disabled={loading || !CHECKOUT_URL}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Passer à Premium
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Puis-je annuler à tout moment ?</h3>
              <p className="text-muted-foreground">
                Oui, vous pouvez annuler votre abonnement à tout moment. Vous conserverez l'accès Premium jusqu'à la fin de votre période de facturation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Comment fonctionne le paiement ?</h3>
              <p className="text-muted-foreground">
                Le paiement est sécurisé et géré par Lemonsqueezy. Vous pouvez payer par carte bancaire. La facturation est mensuelle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Y a-t-il un engagement ?</h3>
              <p className="text-muted-foreground">
                Non, il n'y a aucun engagement. Vous êtes facturé mensuellement et pouvez arrêter quand vous le souhaitez.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
