import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePremium } from '@/contexts/PremiumContext';

interface PremiumLimits {
  canCreateGroup: boolean;
  canCreateEvent: boolean;
  ownedGroupsCount: number;
  eventsThisYearCount: number;
  isLoading: boolean;
  maxGroups: number;
  maxEventsPerYear: number;
}

export function usePremiumLimits() {
  const { isPremium, loading: premiumLoading } = usePremium();
  const [limits, setLimits] = useState<PremiumLimits>({
    canCreateGroup: false,
    canCreateEvent: false,
    ownedGroupsCount: 0,
    eventsThisYearCount: 0,
    isLoading: true,
    maxGroups: 1,
    maxEventsPerYear: 10,
  });

  useEffect(() => {
    async function fetchLimits() {
      if (premiumLoading) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLimits(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Si premium, limites illimitées
        if (isPremium) {
          setLimits({
            canCreateGroup: true,
            canCreateEvent: true,
            ownedGroupsCount: 0,
            eventsThisYearCount: 0,
            isLoading: false,
            maxGroups: Infinity,
            maxEventsPerYear: Infinity,
          });
          return;
        }

        // Compter les groupes possédés
        const { count: ownedGroupsCount, error: groupsError } = await supabase
          .from('hiking_groups')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);

        if (groupsError) throw groupsError;

        // Compter les événements créés cette année
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const { count: eventsThisYearCount, error: eventsError } = await supabase
          .from('hiking_events')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', user.id)
          .gte('created_at', startOfYear);

        if (eventsError) throw eventsError;

        setLimits({
          canCreateGroup: (ownedGroupsCount ?? 0) < 1,
          canCreateEvent: (eventsThisYearCount ?? 0) < 10,
          ownedGroupsCount: ownedGroupsCount ?? 0,
          eventsThisYearCount: eventsThisYearCount ?? 0,
          isLoading: false,
          maxGroups: 1,
          maxEventsPerYear: 10,
        });
      } catch (error) {
        console.error('Error fetching premium limits:', error);
        setLimits(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchLimits();
  }, [isPremium, premiumLoading]);

  return limits;
}
