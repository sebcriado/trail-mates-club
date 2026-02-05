import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudRain, Sun, Wind, Droplets, Crown, Lock } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { usePremium } from "@/contexts/PremiumContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface WeatherWidgetProps {
  location: string;
  date?: string;
}

export function WeatherWidget({ location, date }: WeatherWidgetProps) {
  const { isPremium } = usePremium();
  const { weather, loading, error } = useWeather(location, date);

  // Si l'utilisateur n'est pas premium, afficher un call-to-action
  if (!isPremium) {
    return (
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-accent" />
            <Cloud className="h-5 w-5" />
            Météo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Consultez les prévisions météo pour planifier vos randonnées en toute sérénité
            </p>
            <Link to="/pricing">
              <Button size="sm" className="bg-gradient-trail hover:opacity-90">
                <Crown className="h-4 w-4 mr-2" />
                Passer à Premium
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cloud className="h-5 w-5" />
            Météo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cloud className="h-5 w-5" />
            Météo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || "Données météo non disponibles"}</p>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (iconCode: string) => {
    // Icônes OpenWeather : 01d = soleil, 02-04 = nuages, 09-10 = pluie, etc.
    if (iconCode.startsWith('01')) return <Sun className="h-8 w-8 text-yellow-500" />;
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain className="h-8 w-8 text-blue-500" />;
    return <Cloud className="h-8 w-8 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cloud className="h-5 w-5" />
          Météo
          <Badge variant="outline" className="ml-auto text-xs border-accent/30 text-accent">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getWeatherIcon(weather.icon)}
            <div>
              <p className="text-3xl font-bold">{weather.temp}°C</p>
              <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="flex flex-col items-center">
            <Wind className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Vent</p>
            <p className="text-sm font-semibold">{Math.round(weather.wind_speed * 3.6)} km/h</p>
          </div>
          <div className="flex flex-col items-center">
            <Droplets className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Humidité</p>
            <p className="text-sm font-semibold">{weather.humidity}%</p>
          </div>
          <div className="flex flex-col items-center">
            <Sun className="h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Ressenti</p>
            <p className="text-sm font-semibold">{weather.feels_like}°C</p>
          </div>
        </div>

        {weather.temp < 5 && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              ❄️ Températures froides prévues, prévoyez des vêtements chauds
            </p>
          </div>
        )}

        {weather.temp > 30 && (
          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 rounded-md">
            <p className="text-xs text-orange-800 dark:text-orange-200">
              ☀️ Fortes chaleurs prévues, pensez à l'hydratation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
