'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/leagues/public?limit=6').then(r => r.json()).then(d => { if (d.success) setLeagues(d.data.leagues); }).catch(() => {});
    fetch('/api/tournaments/public?limit=6').then(r => r.json()).then(d => { if (d.success) setTournaments(d.data.tournaments); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-purple/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-electric-green/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-32 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-4xl mx-auto">
            <Badge variant="purple" size="md" className="mb-6">Next-Gen Esports Ecosystem</Badge>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">Compete. Climb. <span className="text-gradient">Conquer.</span></h1>
            <p className="text-lg sm:text-xl text-muted mb-8 max-w-2xl mx-auto">The ultimate esports platform for creating leagues, running tournaments, and competing against players worldwide.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/signup"><Button size="lg" className="text-base">Get Started Free</Button></Link>
              <Link href="/leagues"><Button variant="outline" size="lg" className="text-base">Browse Leagues</Button></Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
            {[
              { title: 'Create Leagues', desc: 'Full seasonal leagues with standings, fixtures, and promotion/relegation.', icon: '🏆' },
              { title: 'Run Tournaments', desc: 'Knockout, group stage, double elim — all formats supported.', icon: '⚔️' },
              { title: 'Compete & Climb', desc: 'Rank up, earn achievements, and dominate the leaderboards.', icon: '📈' },
            ].map((item, i) => (
              <Card key={i} hover className="text-center p-6"><div className="text-3xl mb-3">{item.icon}</div><CardTitle>{item.title}</CardTitle><CardDescription className="mt-1">{item.desc}</CardDescription></Card>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-2xl font-bold">Active Leagues</h2><p className="text-muted text-sm">Public leagues you can join right now</p></div>
          <Link href="/leagues"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.length > 0 ? leagues.map((l) => (
            <Link key={l._id} href={`/leagues/${l._id}`}>
              <Card hover className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple/30 to-electric-green/30 flex items-center justify-center font-bold text-sm">{l.name[0]}</div>
                  <div><CardTitle className="text-sm">{l.name}</CardTitle><p className="text-xs text-muted">{l.admin?.username || 'Unknown'}</p></div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted"><span>{l.playerCount} players</span>{l.region && <span>{l.region}</span>}<Badge variant="green" size="sm">Open</Badge></div>
              </Card>
            </Link>
          )) : <p className="text-muted col-span-full text-center py-8">No public leagues yet. Be the first to create one!</p>}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-2xl font-bold">Live Tournaments</h2><p className="text-muted text-sm">Active and upcoming competitions</p></div>
          <Link href="/tournaments"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.length > 0 ? tournaments.map((t) => (
            <Link key={t._id} href={`/tournaments/${t._id}`}>
              <Card hover className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-green/30 to-neon-purple/30 flex items-center justify-center font-bold text-sm">{t.name[0]}</div>
                  <div><CardTitle className="text-sm">{t.name}</CardTitle><p className="text-xs text-muted">{t.admin?.username || 'Unknown'}</p></div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{t.currentPlayers}/{t.maxPlayers}</span>
                  <Badge variant={t.status === 'REGISTRATION' ? 'green' : 'yellow'} size="sm">{t.status === 'REGISTRATION' ? 'Open' : t.status}</Badge>
                  <Badge variant="purple" size="sm">{t.format}</Badge>
                </div>
              </Card>
            </Link>
          )) : <p className="text-muted col-span-full text-center py-8">No public tournaments yet.</p>}
        </div>
      </section>
    </div>
  );
}
