'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageLoading, EmptyState } from '@/components/ui/loading';

export default function PlayerProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<any>(null); const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/users/search?q=${params.id}`, { credentials: 'include' }).then(r => r.json())
        .then(d => { if (d.success) { const found = d.data.users.find((u: any) => u._id === params.id); if (found) setProfile(found); } })
        .catch(() => {}).finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <PageLoading />;
  if (!profile) return <EmptyState title="Player not found" />;

  const s = profile.stats || {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-6 mb-8">
        <Avatar name={profile.username} size="lg" />
        <div><h1 className="text-2xl font-bold">{profile.username}</h1><Badge variant="purple" size="sm" className="mt-1">Rating: {profile.rating || 1000}</Badge></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Matches', value: s.totalMatches || 0, color: 'text-gradient' },
          { label: 'Wins', value: s.wins || 0, color: 'text-electric-green' },
          { label: 'Draws', value: s.draws || 0, color: 'text-yellow-400' },
          { label: 'Losses', value: s.losses || 0, color: 'text-red-400' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center"><div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div><p className="text-xs text-muted">{stat.label}</p></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle>Career Stats</CardTitle></CardHeader>
        <CardContent><div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted">Goals Scored:</span> {s.goalsScored || 0}</div>
          <div><span className="text-muted">Goals Conceded:</span> {s.goalsConceded || 0}</div>
          <div><span className="text-muted">Win Streak:</span> {s.winStreak || 0}</div>
          <div><span className="text-muted">Best Streak:</span> {s.bestWinStreak || 0}</div>
        </div></CardContent>
      </Card>
    </div>
  );
}
