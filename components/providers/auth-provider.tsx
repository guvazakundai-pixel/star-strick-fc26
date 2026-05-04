'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextType {
  user: { id: string; email: string; role: string; fcUsername: string | null } | null
  isOpen: boolean
  openAuth: (tab?: 'signin' | 'join') => void
  closeAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultTab, setDefaultTab] = useState<'signin' | 'join'>('join')
  const [user, setUser] = useState<AuthContextType['user']>(null)

  const openAuth = (tab: 'signin' | 'join' = 'join') => {
    setDefaultTab(tab)
    setIsOpen(true)
  }

  const closeAuth = () => setIsOpen(false)

  return (
    <AuthContext.Provider value={{ user, isOpen, openAuth, closeAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
