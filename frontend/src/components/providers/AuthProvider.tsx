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
