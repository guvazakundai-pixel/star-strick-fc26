'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PageLoading } from '@/components/ui/loading';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export default function MatchDetailPage() {
  const params = useParams(); const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [match, setMatch] = useState<any>(null); const [loading, setLoading] = useState(true);
  const [homeScore, setHomeScore] = useState(''); const [awayScore, setAwayScore] = useState('');
  const [disputeReason, setDisputeReason] = useState(''); const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/matches/${params.id}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setMatch(json.data.match);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (params.id) load();
  }, [params.id, user, isLoading]);

  const handleSubmitScore = async () => {
    if (!homeScore || !awayScore) { toast.error('Enter both scores'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) }), credentials: 'include' });
      const json = await res.json();
      if (json.success) { toast.success('Score submitted!'); load(); } else toast.error(json.error);
    } catch { toast.error('Failed'); } finally { setSubmitting(false); }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${params.id}/confirm`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (json.success) { toast.success('Confirmed!'); load(); } else toast.error(json.error);
    } catch { toast.error('Failed'); } finally { setSubmitting(false); }
  };

  if (isLoading || loading) return <PageLoading />;
  if (!match) return null;

  const isHome = match.homePlayerId?._id === user?.id;
  const isAway = match.awayPlayerId?._id === user?.id;
  const isPlayer = isHome || isAway;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Card className="text-center mb-6"><CardContent className="p-8">
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center"><Avatar name={match.homePlayerId?.username || 'Home'} size="lg" className="mx-auto mb-2" /><p className="font-semibold">{match.homePlayerId?.username || 'Home'}</p></div>
          <div className="text-3xl font-bold">{match.homeScore !== undefined ? <span className="text-gradient">{match.homeScore} - {match.awayScore}</span> : <span className="text-muted">vs</span>}</div>
          <div className="text-center"><Avatar name={match.awayPlayerId?.username || 'Away'} size="lg" className="mx-auto mb-2" /><p className="font-semibold">{match.awayPlayerId?.username || 'Away'}</p></div>
        </div>
        <Badge variant={match.status === 'COMPLETED' ? 'green' : match.status === 'DISPUTED' ? 'red' : match.status === 'SCHEDULED' ? 'default' : 'yellow'} size="md">{match.status}</Badge>
      </CardContent></Card>

      {match.status === 'SCHEDULED' && isPlayer && (
        <Card className="mb-4"><CardHeader><CardTitle>Submit Score</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Your Score" type="number" min={0} value={isHome ? homeScore : awayScore} onChange={(e) => isHome ? setHomeScore(e.target.value) : setAwayScore(e.target.value)} placeholder="0" />
              <Input label="Opponent Score" type="number" min={0} value={isHome ? awayScore : homeScore} onChange={(e) => isHome ? setAwayScore(e.target.value) : setHomeScore(e.target.value)} placeholder="0" />
            </div>
            <Button onClick={handleSubmitScore} loading={submitting} className="w-full">Submit Score</Button>
          </CardContent></Card>
      )}

      {match.status === 'IN_PROGRESS' && isPlayer && (
        <Card className="mb-4"><CardHeader><CardTitle>Confirm Result</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted">Score: {match.homeScore} - {match.awayScore}</p>
            <Button onClick={handleConfirm} loading={submitting} className="w-full">Confirm Result</Button>
          </CardContent></Card>
      )}

      {match.status === 'COMPLETED' && (
        <Card><CardHeader><CardTitle>Result</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold text-center text-gradient">
            {(match.winnerId === match.homePlayerId?._id || match.winnerId === match.homePlayerId) ? `${match.homePlayerId?.username} Wins!` : `${match.awayPlayerId?.username} Wins!`}
          </p></CardContent></Card>
      )}
    </div>
  );
}
