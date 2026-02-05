import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  rain_probability?: number;
}

export function useWeather(location: string, date?: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

      if (!apiKey) {
        setError('Configuration météo manquante');
        setLoading(false);
        return;
      }

      if (!location) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Utiliser l'API OpenWeatherMap pour obtenir la météo
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=fr`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();

        setWeather({
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          humidity: data.main.humidity,
          wind_speed: data.wind.speed,
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Impossible de récupérer la météo');
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [location, date]);

  return { weather, loading, error };
}
