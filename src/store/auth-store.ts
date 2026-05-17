import { create } from "zustand";

export type AuthUser = {
  id: string;
  username: string;
  email?: string;
  role: "PLAYER" | "MANAGER" | "ADMIN";
  displayName?: string | null;
  avatarUrl?: string | null;
  platform?: string | null;
  clubId?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
};

const STORAGE_KEY = "ss_auth_user";

function loadFromStorage(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* noop */ }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  hydrate: async () => {
    if (get().initialized) return;

    const cached = loadFromStorage();
    if (cached) {
      set({ user: cached, loading: false });
    }

    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const user = data.user as AuthUser;
        set({ user, loading: false, initialized: true });
        saveToStorage(user);
        return;
      }
    } catch { /* not authenticated */ }

    set({ user: null, loading: false, initialized: true });
    saveToStorage(null);
  },

  setUser: (user) => {
    set({ user });
    saveToStorage(user);
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    set({ user: null });
    saveToStorage(null);
  },
}));
