"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const syncUser = async (session: any) => {
      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const profile = await api.auth.me();
        setUser(profile);
        
        if (profile.theme_accent && typeof document !== "undefined") {
          const colorMap: Record<string, string> = {
            cyan: "#06b6d4",
            violet: "#8b5cf6",
            orange: "#f97316"
          };
          const hex = colorMap[profile.theme_accent] || profile.theme_accent;
          document.documentElement.style.setProperty("--theme-accent", hex);
          document.documentElement.style.setProperty("--theme-accent-dim", `color-mix(in srgb, ${hex} 15%, transparent)`);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data }) => syncUser(data.session));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => syncUser(session)
    );

    return () => subscription.unsubscribe();
  }, [setUser, setIsLoading]);

  return <>{children}</>;
}
