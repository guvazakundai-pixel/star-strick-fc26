'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/loading';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    Promise.all([
      fetch('/api/leagues', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/tournaments', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/matches?status=SCHEDULED', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/notifications', { credentials: 'include' }).then(r => r.json()),
    ]).then(([l, t, m, n]) => {
      setData({
        leagues: l.success ? l.data.leagues : [], tournaments: t.success ? t.data.tournaments : [],
        matches: m.success ? m.data.matches : [], notifications: n.success ? n.data.notifications : [],
        unreadCount: n.success ? n.data.unreadCount : 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, isLoading, router]);

  if (isLoading || loading) return <PageLoading />;
  if (!data) return null;
  const { leagues, tournaments, matches, notifications, unreadCount } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold">Player Hub</h1><p className="text-muted text-sm">Welcome back, {user?.username}</p></div>
        <Link href="/leagues/create"><Button>Create League</Button></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Leagues', value: leagues.length }, { label: 'Tournaments', value: tournaments.length },
          { label: 'Upcoming Matches', value: matches.length }, { label: 'Total Wins', value: user?.stats?.wins || 0 },
        ].map((s) => <Card key={s.label} className="p-4 text-center"><div className="text-2xl font-bold text-gradient">{s.value}</div><p className="text-xs text-muted mt-1">{s.label}</p></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="mb-4"><CardHeader><CardTitle className="text-sm">My Leagues</CardTitle><Link href="/leagues/create"><Button variant="ghost" size="sm">+ New</Button></Link></CardHeader>
            <CardContent>{leagues.length === 0 ? <div className="text-center py-8"><p className="text-muted text-sm mb-3">No leagues yet</p><Link href="/leagues/create"><Button size="sm">Create a League</Button></Link></div> :
              <div className="space-y-2">{leagues.slice(0, 5).map((l: any) => (
                <Link key={l._id} href={`/leagues/${l._id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple/30 to-electric-green/30 flex items-center justify-center text-xs font-bold">{l.name[0]}</div>
                      <div><p className="text-sm font-medium">{l.name}</p><p className="text-xs text-muted">Season {l.currentSeason} | {l.participants?.length || 0} players</p></div>
                    </div>
                    <Badge variant={l.type === 'PUBLIC' ? 'green' : 'purple'} size="sm">{l.type}</Badge>
                  </div>
                </Link>
              ))}</div>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Upcoming Matches</CardTitle></CardHeader>
            <CardContent>{matches.length === 0 ? <p className="text-muted text-sm text-center py-8">No upcoming matches</p> :
              <div className="space-y-2">{matches.slice(0, 5).map((m: any) => (
                <Link key={m._id} href={`/matches/${m._id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2 text-sm"><span className="font-medium">{m.homePlayerId?.username}</span><span className="text-muted">vs</span><span className="font-medium">{m.awayPlayerId?.username}</span></div>
                    <Badge variant="yellow" size="sm">Pending</Badge>
                  </div>
                </Link>
              ))}</div>}</CardContent></Card>
        </div>
        <div>
          <Card className="mb-4"><CardHeader><CardTitle className="text-sm">My Tournaments</CardTitle><Link href="/tournaments/create"><Button variant="ghost" size="sm">+ New</Button></Link></CardHeader>
            <CardContent>{tournaments.length === 0 ? <div className="text-center py-8"><p className="text-muted text-sm mb-3">No tournaments yet</p><Link href="/tournaments/create"><Button size="sm">Create a Tournament</Button></Link></div> :
              <div className="space-y-2">{tournaments.slice(0, 5).map((t: any) => (
                <Link key={t._id} href={`/tournaments/${t._id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-green/30 to-neon-purple/30 flex items-center justify-center text-xs font-bold">{t.name[0]}</div>
                      <div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted">{t.format} | {t.currentPlayers}/{t.maxPlayers}</p></div>
                    </div>
                    <Badge variant={t.status === 'REGISTRATION' ? 'green' : t.status === 'IN_PROGRESS' ? 'yellow' : 'default'} size="sm">{t.status}</Badge>
                  </div>
                </Link>
              ))}</div>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Notifications</CardTitle>{unreadCount > 0 && <Badge variant="purple" size="sm">{unreadCount} new</Badge>}</CardHeader>
            <CardContent>{notifications.length === 0 ? <p className="text-muted text-sm text-center py-8">No notifications</p> :
              <div className="space-y-2">{notifications.slice(0, 5).map((n: any) => (
                <div key={n._id} className={`p-3 rounded-lg text-sm ${n.read ? '' : 'bg-white/5 border border-glass-border'}`}>
                  <p className="font-medium">{n.title}</p><p className="text-muted text-xs">{n.message}</p>
                </div>
              ))}</div>}</CardContent></Card>
        </div>
      </div>
    </div>
  );
}
