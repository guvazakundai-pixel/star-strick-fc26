'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Trophy } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  const { openAuth } = useAuth()

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">Star Strick FC26</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The premier EA FC26 competitive rankings and club leaderboards platform.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rankings" className="hover:underline">Rankings</Link></li>
              <li><Link href="/clubs" className="hover:underline">Clubs</Link></li>
              <li><Link href="/dashboard" className="hover:underline">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Join the Community</h3>
            <Button onClick={() => openAuth('join')} className="w-full">
              Join Rankings
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Star Strick FC26. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
