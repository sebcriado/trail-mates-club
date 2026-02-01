import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  status: string;
  plan_name: string;
  current_period_end: string | null;
  cancelled_at: string | null;
  ends_at: string | null;
}

interface PremiumContextType {
  isPremium: boolean;
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  subscription: null,
  loading: true,
  refreshSubscription: async () => {},
});

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
};

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider = ({ children }: PremiumProviderProps) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, status, plan_name, current_period_end, cancelled_at, ends_at")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is expected for non-premium users
        console.error("Error fetching subscription:", error);
      }

      setSubscription(data || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPremium =
    subscription?.status === "active" &&
    (!subscription.ends_at || new Date(subscription.ends_at) > new Date());

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        subscription,
        loading,
        refreshSubscription: fetchSubscription,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};
