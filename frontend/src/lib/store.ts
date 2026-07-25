"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "./api";

interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "obx-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
