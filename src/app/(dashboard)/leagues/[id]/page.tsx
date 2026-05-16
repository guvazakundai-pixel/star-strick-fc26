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

export default function LeagueDetailPage() {
  const params = useParams(); const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [league, setLeague] = useState<any>(null); const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`/api/leagues/${params.id}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setLeague(json.data.league);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (params.id) load();
  }, [params.id, user, isLoading]);

  const handleJoin = async () => {
    const res = await fetch(`/api/leagues/${params.id}/join`, { method: 'POST', credentials: 'include' });
    const json = await res.json();
    if (json.success) { toast.success('Joined!'); load(); } else toast.error(json.error);
  };

  const handleFixtures = async () => {
    const res = await fetch(`/api/leagues/${params.id}/generate-fixtures`, { method: 'POST', credentials: 'include' });
    const json = await res.json();
    if (json.success) { toast.success('Fixtures generated!'); load(); } else toast.error(json.error);
  };

  if (isLoading || loading) return <PageLoading />;
  if (!league) return <EmptyState title="League not found" />;

  const isAdmin = league.adminId?._id === user?.id || league.adminId === user?.id;
  const isMember = league.participants?.some((p: any) => (p._id || p) === user?.id);
  const season = league.currentSeasonData;
  const standings = [...(season?.standings || [])].sort((a: any, b: any) => b.points - a.points || (b.goalDifference - a.goalDifference) || b.goalsFor - a.goalsFor);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-purple/30 to-electric-green/30 flex items-center justify-center text-2xl font-bold">{league.name?.[0]}</div>
          <div><h1 className="text-2xl font-bold">{league.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted">
              <Badge variant={league.type === 'PUBLIC' ? 'green' : 'purple'} size="sm">{league.type}</Badge>
              <span>Season {league.currentSeason} • {league.participants?.length || 0}/{league.settings?.maxPlayers || 20}</span>
            </div>
          </div>
        </div>
        {!isMember ? <Button onClick={handleJoin}>Join League</Button> :
         isAdmin && (!season?.fixtures?.length) && league.participants?.length >= 2 ? <Button onClick={handleFixtures}>Generate Fixtures</Button> : null}
      </div>
      <Tabs tabs={[{ id: 'standings', label: 'Standings' }, { id: 'players', label: 'Players' }, { id: 'settings', label: 'Settings' }]} defaultTab="standings">
        {(tab) => (
          <>
            {tab === 'standings' && <Card><CardContent className="p-0 overflow-x-auto">
              {standings.length === 0 ? <div className="p-8 text-center text-muted text-sm">No standings yet.</div> :
              <table className="w-full text-sm">
                <thead><tr className="border-b border-glass-border text-muted">
                  <th className="text-left p-3">#</th><th className="text-left p-3">Player</th><th className="text-center p-3">P</th><th className="text-center p-3">W</th>
                  <th className="text-center p-3">D</th><th className="text-center p-3">L</th><th className="text-center p-3">GF</th><th className="text-center p-3">GA</th>
                  <th className="text-center p-3">GD</th><th className="text-center p-3">Pts</th><th className="text-center p-3">Form</th>
                </tr></thead>
                <tbody>{standings.map((s: any, i: number) => (
                  <tr key={s.playerId?._id || s.playerId} className="border-b border-glass-border/50 hover:bg-white/5">
                    <td className="p-3 font-bold">{i + 1}</td>
                    <td className="p-3"><div className="flex items-center gap-2"><Avatar name={s.playerId?.username || 'Player'} size="sm" /><span>{s.playerId?.username || 'Unknown'}</span></div></td>
                    <td className="text-center p-3">{s.played}</td><td className="text-center p-3 text-electric-green">{s.wins}</td>
                    <td className="text-center p-3 text-yellow-400">{s.draws}</td><td className="text-center p-3 text-red-400">{s.losses}</td>
                    <td className="text-center p-3">{s.goalsFor}</td><td className="text-center p-3">{s.goalsAgainst}</td>
                    <td className="text-center p-3 font-medium">{s.goalDifference > 0 ? '+' : ''}{s.goalDifference}</td>
                    <td className="text-center p-3 font-bold text-neon-purple">{s.points}</td>
                    <td className="text-center p-3"><div className="flex gap-0.5 justify-center">{(s.form || []).slice(-5).map((f: string, fi: number) => (
                      <span key={fi} className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold ${f === 'W' ? 'bg-electric-green/20 text-electric-green' : f === 'D' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{f}</span>
                    ))}</div></td>
                  </tr>
                ))}</tbody>
              </table>}
            </CardContent></Card>}
            {tab === 'players' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {league.participants?.map((p: any) => (
                <Card key={p._id || p} className="flex items-center gap-3 p-3"><Avatar name={p.username || 'Player'} size="sm" /><div><p className="text-sm font-medium">{p.username || 'Unknown'}</p><p className="text-xs text-muted">Rating: {p.rating || 1000}</p></div></Card>
              ))}
            </div>}
            {tab === 'settings' && <Card><CardContent><p className="text-sm text-muted">{isAdmin ? 'Admin controls appear here.' : 'Settings managed by admin.'}</p></CardContent></Card>}
          </>
        )}
      </Tabs>
    </div>
  );
}
