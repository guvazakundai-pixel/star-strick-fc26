'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/', label: 'Home' }, { href: '/leagues', label: 'Leagues' },
  { href: '/tournaments', label: 'Tournaments' }, { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <nav className="sticky top-0 z-40 glass border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-electric-green flex items-center justify-center font-bold text-white text-sm">S</div>
            <span className="font-bold text-lg hidden sm:block"><span className="text-gradient">STAR STRICK</span><span className="text-foreground/60 ml-1">FC26</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cn('px-3 py-2 rounded-lg text-sm font-medium transition', pathname === l.href ? 'bg-neon-purple/20 text-neon-purple' : 'text-muted hover:text-foreground hover:bg-white/5')}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <span className="text-sm text-muted group-hover:text-foreground hidden sm:block">{user.username}</span>
                <Avatar name={user.username} src={user.avatar} size="sm" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link href="/signup"><Button size="sm">Sign up</Button></Link>
              </div>
            )}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-glass-border p-4 space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn('block px-3 py-2 rounded-lg text-sm font-medium', pathname === l.href ? 'bg-neon-purple/20 text-neon-purple' : 'text-muted hover:text-foreground hover:bg-white/5')}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
