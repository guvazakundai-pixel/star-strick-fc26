'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PageLoading, EmptyState } from '@/components/ui/loading';
import { Tabs } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export default function TournamentDetailPage() {
  const params = useParams(); const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [t, setT] = useState<any>(null); const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`/api/tournaments/${params.id}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setT(json.data.tournament);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (params.id) load();
  }, [params.id, user, isLoading]);

  const handleJoin = async () => {
    const res = await fetch(`/api/tournaments/${params.id}/join`, { method: 'POST', credentials: 'include' });
    const json = await res.json();
    if (json.success) { toast.success('Joined!'); load(); } else toast.error(json.error);
  };

  const handleStart = async () => {
    const res = await fetch(`/api/tournaments/${params.id}/start`, { method: 'POST', credentials: 'include' });
    const json = await res.json();
    if (json.success) { toast.success('Started!'); load(); } else toast.error(json.error);
  };

  if (isLoading || loading) return <PageLoading />;
  if (!t) return <EmptyState title="Not found" />;

  const isAdmin = t.adminId?._id === user?.id || t.adminId === user?.id;
  const isMember = t.participants?.some((p: any) => (p._id || p) === user?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-electric-green/30 to-neon-purple/30 flex items-center justify-center text-2xl font-bold">{t.name?.[0]}</div>
          <div><h1 className="text-2xl font-bold">{t.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted">
              <Badge variant="purple" size="sm">{t.format}</Badge>
              <Badge variant={t.status === 'REGISTRATION' ? 'green' : t.status === 'IN_PROGRESS' ? 'yellow' : 'default'} size="sm">{t.status}</Badge>
              <span>{t.currentPlayers}/{t.maxPlayers}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isMember && t.status === 'REGISTRATION' && <Button onClick={handleJoin}>Join</Button>}
          {isAdmin && t.status === 'REGISTRATION' && t.participants?.length >= 2 && <Button onClick={handleStart}>Start</Button>}
        </div>
      </div>
      <Tabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'bracket', label: 'Bracket' }, { id: 'groups', label: 'Groups' }, { id: 'players', label: 'Players' }]} defaultTab="overview">
        {(tab) => (<>
          {tab === 'overview' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
              <p><span className="text-muted">Format:</span> {t.format}</p><p><span className="text-muted">Players:</span> {t.currentPlayers}/{t.maxPlayers}</p>
              <p><span className="text-muted">Best of:</span> {t.rules?.bestOf || 1}</p>
              {t.startDate && <p><span className="text-muted">Started:</span> {new Date(t.startDate).toLocaleDateString()}</p>}
              {t.description && <><p className="text-muted mt-2">Description</p><p>{t.description}</p></>}
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Rules</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
              <p><span className="text-muted">Group Stage:</span> {t.rules?.groupStage ? 'Yes' : 'No'}</p>
              <p><span className="text-muted">Group Size:</span> {t.rules?.groupSize || '-'}</p>
              <p><span className="text-muted">Qualify/Group:</span> {t.rules?.qualificationPerGroup || '-'}</p>
              <p><span className="text-muted">Home & Away:</span> {t.rules?.homeAway ? 'Yes' : 'No'}</p>
            </CardContent></Card>
          </div>}
          {tab === 'bracket' && <Card><CardContent className="p-8">
            {t.bracket?.length > 0 ? <div className="overflow-x-auto"><div className="flex gap-8 min-w-max">{t.bracket.map((round: any[], ri: number) => (
              <div key={ri} className="flex flex-col gap-4">
                <p className="text-sm font-semibold text-muted mb-2">{ri === 0 ? 'Round 1' : ri === t.bracket.length - 1 ? 'Final' : `Round ${ri + 1}`}</p>
                {round.map((m: any, mi: number) => (
                  <div key={mi} className="glass rounded-lg p-3 w-48">
                    <div className="flex items-center justify-between text-sm mb-1"><span className="truncate">{m.homePlayerId || 'TBD'}</span><span className="font-bold">{m.homeScore ?? '-'}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="truncate">{m.awayPlayerId || 'TBD'}</span><span className="font-bold">{m.awayScore ?? '-'}</span></div>
                    <Badge variant={m.status === 'COMPLETED' ? 'green' : m.status === 'SCHEDULED' ? 'default' : 'yellow'} size="sm" className="mt-2">{m.status}</Badge>
                  </div>
                ))}
              </div>
            ))}</div></div> : <div className="text-center text-muted text-sm py-8">Bracket appears once started.</div>}
          </CardContent></Card>}
          {tab === 'groups' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.groups?.map((g: any) => (
              <Card key={g.name}><CardHeader><CardTitle>Group {g.name}</CardTitle></CardHeader>
                <CardContent><table className="w-full text-sm"><thead><tr className="text-muted border-b border-glass-border"><th className="text-left p-2">#</th><th className="text-left p-2">Player</th><th className="text-center p-2">P</th><th className="text-center p-2">GD</th><th className="text-center p-2">Pts</th></tr></thead>
                  <tbody>{(g.standings || []).sort((a: any, b: any) => b.points - a.points || (b.goalDifference||0) - (a.goalDifference||0)).map((s: any, i: number) => (
                    <tr key={s.playerId?._id || s.playerId} className="border-b border-glass-border/50"><td className="p-2 font-bold">{i + 1}</td><td className="p-2">{s.playerId?.username || 'Player'}</td><td className="text-center p-2">{s.played || 0}</td><td className="text-center p-2">{s.goalDifference || 0}</td><td className="text-center p-2 font-bold text-neon-purple">{s.points || 0}</td></tr>
                  ))}</tbody></table></CardContent></Card>
            ))}
            {(!t.groups || t.groups.length === 0) && <div className="col-span-full text-center text-muted text-sm py-8">No groups yet.</div>}
          </div>}
          {tab === 'players' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {t.participants?.map((p: any) => (
              <Card key={p._id || p} className="flex items-center gap-3 p-3"><Avatar name={p.username || 'Player'} size="sm" /><div><p className="text-sm font-medium">{p.username || 'Unknown'}</p><p className="text-xs text-muted">Rating: {p.rating || 1000}</p></div></Card>
            ))}
          </div>}
        </>)}
      </Tabs>
    </div>
  );
}
