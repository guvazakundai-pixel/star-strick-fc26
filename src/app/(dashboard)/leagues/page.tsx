'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading, EmptyState } from '@/components/ui/loading';
import { Tabs } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';

export default function LeaguesPage() {
  const { isLoading } = useAuthStore();
  const [myLeagues, setMy] = useState<any[]>([]);
  const [publicLeagues, setPublic] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    Promise.all([
      fetch('/api/leagues', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/leagues/public', { credentials: 'include' }).then(r => r.json()),
    ]).then(([a, b]) => { if (a.success) setMy(a.data.leagues); if (b.success) setPublic(b.data.leagues); })
    .catch(() => {}).finally(() => setLoading(false));
  }, [isLoading]);

  if (isLoading || loading) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold">Leagues</h1><p className="text-muted text-sm">Create, join, and compete in leagues</p></div>
        <div className="flex gap-2"><Link href="/leagues/join"><Button variant="outline">Join League</Button></Link><Link href="/leagues/create"><Button>Create League</Button></Link></div>
      </div>
      <Tabs tabs={[{ id: 'my', label: 'My Leagues' }, { id: 'public', label: 'Discover' }]} defaultTab="my">
        {(tab) => (
          <>
            {tab === 'my' && (myLeagues.length === 0 ?
              <EmptyState title="No leagues yet" description="Create your first league or join one using an invite code." action={<div className="flex gap-2"><Link href="/leagues/create"><Button size="sm">Create League</Button></Link><Link href="/leagues/join"><Button variant="outline" size="sm">Join League</Button></Link></div>} /> :
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{myLeagues.map((l: any) => (
                <Link key={l._id} href={`/leagues/${l._id}`}>
                  <Card hover className="h-full p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple/30 to-electric-green/30 flex items-center justify-center font-bold text-sm">{l.name[0]}</div>
                      <div><CardTitle className="text-sm">{l.name}</CardTitle><p className="text-xs text-muted">{l.type} League</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted"><span>Season {l.currentSeason}</span><span>•</span><span>{l.participants?.length || 0} players</span></div>
                  </Card>
                </Link>
              ))}</div>)}
            {tab === 'public' && (publicLeagues.length === 0 ?
              <EmptyState title="No public leagues" description="There are no public leagues available right now." action={<Link href="/leagues/create"><Button size="sm">Create League</Button></Link>} /> :
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{publicLeagues.map((l: any) => (
                <Link key={l._id} href={`/leagues/${l._id}`}>
                  <Card hover className="h-full p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple/30 to-electric-green/30 flex items-center justify-center font-bold text-sm">{l.name[0]}</div>
                      <div><CardTitle className="text-sm">{l.name}</CardTitle><p className="text-xs text-muted">by {l.admin?.username}</p></div>
                    </div>
                    <div className="flex gap-2 text-xs text-muted"><Badge variant="green" size="sm">Open</Badge><span>{l.playerCount} players</span></div>
                  </Card>
                </Link>
              ))}</div>)}
          </>
        )}
      </Tabs>
    </div>
  );
}
