"use client";

import { useState, useEffect } from "react";

type SessionData = {
  userId: string;
  username: string;
  role: string;
} | null;

let cachedSession: SessionData = null;
let sessionFetchPromise: Promise<SessionData> | null = null;

export function useSession(): SessionData {
  const [session, setSession] = useState<SessionData>(cachedSession);

  useEffect(() => {
    if (cachedSession) {
      setSession(cachedSession);
      return;
    }
    if (!sessionFetchPromise) {
      sessionFetchPromise = fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data?.user ?? null)
        .catch(() => null);
    }
    sessionFetchPromise.then((s) => {
      cachedSession = s;
      setSession(s);
    });
  }, []);

  return session;
}