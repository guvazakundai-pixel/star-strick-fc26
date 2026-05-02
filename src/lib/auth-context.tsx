"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type User = {
  id: string
  username: string
  email: string
  phone?: string
  role: "PLAYER" | "MANAGER" | "ADMIN"
  playerStatus: "UNPLACED" | "PLACED" | "RANKED"
  avatarUrl?: string
  isVerified: boolean
  onboardingComplete: boolean
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, phone?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      if (data.user) setUser(data.user)
    } catch {}
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? "Login failed")
    }
    const data = await res.json()
    setUser(data.user)
  }

  const register = async (username: string, email: string, password: string, phone?: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, phone }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? "Registration failed")
    }
    const data = await res.json()
    setUser(data.user)
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    setUser(null)
    window.location.href = "/"
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
