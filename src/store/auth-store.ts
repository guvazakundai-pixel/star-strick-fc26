'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User { id: string; username: string; email: string; avatar: string; rating: number; rank: number; stats: { totalMatches: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number; winStreak: number; bestWinStreak: number; }; }

interface AuthState { user: User | null; token: string | null; isLoading: boolean; setUser: (u: User | null) => void; setToken: (t: string | null) => void; setLoading: (l: boolean) => void; logout: () => void; }

export const useAuthStore = create<AuthState>()(persist((set) => ({
  user: null, token: null, isLoading: true,
  setUser: (user) => set({ user }), setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }), logout: () => set({ user: null, token: null }),
}), { name: 'auth-storage', partialize: (state) => ({ user: state.user, token: state.token }) }));
