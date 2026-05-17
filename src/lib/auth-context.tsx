"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

type AuthModalTab = "signin" | "join";

interface AuthContextValue {
  open: boolean;
  tab: AuthModalTab;
  openAuth: (initialTab?: AuthModalTab) => void;
  closeAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AuthModalTab>("signin");

  const openAuth = useCallback((initialTab?: AuthModalTab) => {
    setTab(initialTab ?? "signin");
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => setOpen(false), []);

  return (
    <AuthContext.Provider value={{ open, tab, openAuth, closeAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthProvider");
  return ctx;
}

export function AuthUrlHandler() {
  const { openAuth } = useAuthModal();
  const searchParams = useSearchParams();

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "signin") {
      openAuth("signin");
    } else if (auth === "join") {
      openAuth("join");
    }
  }, [searchParams, openAuth]);

  return null;
}
