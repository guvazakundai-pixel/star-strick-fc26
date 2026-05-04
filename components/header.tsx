'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Trophy, Menu } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function Header() {
  const { openAuth } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="font-bold text-lg">Star Strick FC26</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/rankings" className="text-sm font-medium hover:text-primary">
            Rankings
          </Link>
          <Link href="/clubs" className="text-sm font-medium hover:text-primary">
            Clubs
          </Link>
          <Button variant="default" size="sm" onClick={() => openAuth('join')}>
            Join Rankings
          </Button>
        </nav>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-4 mt-8">
              <Link href="/rankings" onClick={() => setMobileMenuOpen(false)}>
                Rankings
              </Link>
              <Link href="/clubs" onClick={() => setMobileMenuOpen(false)}>
                Clubs
              </Link>
              <Button onClick={() => { openAuth('join'); setMobileMenuOpen(false) }}>
                Join Rankings
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Hero Section CTA */}
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">EA FC26 Competitive Rankings</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Join the premier leaderboard for EA FC26 players
        </p>
        <Button size="lg" onClick={() => openAuth('join')}>
          Join Rankings Now
        </Button>
      </div>
    </header>
  )
}
