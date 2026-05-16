'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading, EmptyState } from '@/components/ui/loading';
import { Tabs } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';

export default function TournamentsPage() {
  const { isLoading } = useAuthStore();
  const [my, setMy] = useState<any[]>([]); const [pub, setPub] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    Promise.all([
      fetch('/api/tournaments', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/tournaments/public', { credentials: 'include' }).then(r => r.json()),
    ]).then(([a, b]) => { if (a.success) setMy(a.data.tournaments); if (b.success) setPub(b.data.tournaments); })
    .catch(() => {}).finally(() => setLoading(false));
  }, [isLoading]);

  if (isLoading || loading) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold">Tournaments</h1><p className="text-muted text-sm">Knockout, group stage, hybrid formats</p></div>
        <div className="flex gap-2"><Link href="/tournaments/join"><Button variant="outline">Join</Button></Link><Link href="/tournaments/create"><Button>Create</Button></Link></div>
      </div>
      <Tabs tabs={[{ id: 'my', label: 'My Tournaments' }, { id: 'public', label: 'Discover' }]} defaultTab="my">
        {(tab) => (<>
          {tab === 'my' && (my.length === 0 ? <EmptyState title="No tournaments" description="Create or join one." action={<div className="flex gap-2"><Link href="/tournaments/create"><Button size="sm">Create</Button></Link><Link href="/tournaments/join"><Button variant="outline" size="sm">Join</Button></Link></div>} /> :
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{my.map((t: any) => (
              <Link key={t._id} href={`/tournaments/${t._id}`}><Card hover className="h-full p-5">
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-green/30 to-neon-purple/30 flex items-center justify-center font-bold text-sm">{t.name[0]}</div><CardTitle className="text-sm">{t.name}</CardTitle></div>
                <div className="flex flex-wrap gap-2 text-xs text-muted"><Badge variant="purple" size="sm">{t.format}</Badge><Badge variant={t.status === 'REGISTRATION' ? 'green' : t.status === 'IN_PROGRESS' ? 'yellow' : 'default'} size="sm">{t.status}</Badge><span>{t.currentPlayers}/{t.maxPlayers}</span></div>
              </Card></Link>
            ))}</div>)}
          {tab === 'public' && (pub.length === 0 ? <EmptyState title="No public tournaments" action={<Link href="/tournaments/create"><Button size="sm">Create</Button></Link>} /> :
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{pub.map((t: any) => (
              <Link key={t._id} href={`/tournaments/${t._id}`}><Card hover className="h-full p-5">
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-green/30 to-neon-purple/30 flex items-center justify-center font-bold text-sm">{t.name[0]}</div><div><CardTitle className="text-sm">{t.name}</CardTitle><p className="text-xs text-muted">by {t.admin?.username}</p></div></div>
                <div className="flex flex-wrap gap-2 text-xs text-muted"><Badge variant={t.status === 'REGISTRATION' ? 'green' : 'yellow'} size="sm">{t.status === 'REGISTRATION' ? 'Open' : t.status}</Badge><Badge variant="purple" size="sm">{t.format}</Badge><span>{t.currentPlayers}/{t.maxPlayers}</span></div>
              </Card></Link>
            ))}</div>)}
        </>)}
      </Tabs>
    </div>
  );
}
