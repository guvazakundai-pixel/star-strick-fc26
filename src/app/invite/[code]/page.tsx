'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/loading';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export default function InvitePage() {
  const params = useParams(); const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [invite, setInvite] = useState<any>(null); const [target, setTarget] = useState<any>(null);
  const [loading, setLoading] = useState(true); const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push(`/login?redirect=/invite/${params.code}`); return; }
    fetch(`/api/invites/${params.code}`, { credentials: 'include' }).then(r => r.json())
      .then(json => { if (json.success) { setInvite(json.data.invite); setTarget(json.data.invite.target); } else toast.error(json.error); })
      .catch(() => toast.error('Failed')) .finally(() => setLoading(false));
  }, [params.code, user, isLoading, router]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/invites/${params.code}`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (json.success) { toast.success('Joined!'); router.push(invite?.type === 'LEAGUE' ? `/leagues/${target._id}` : `/tournaments/${target._id}`); }
      else toast.error(json.error);
    } catch { toast.error('Failed'); } finally { setJoining(false); }
  };

  if (isLoading || loading) return <PageLoading />;
  if (!invite) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center"><CardContent className="p-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/30 to-electric-green/30 flex items-center justify-center text-3xl font-bold mx-auto mb-4">{target?.name?.[0] || '?'}</div>
        <CardTitle className="text-xl mb-1">{target?.name || 'Competition'}</CardTitle>
        <CardDescription className="mb-4">{invite.type === 'LEAGUE' ? 'League' : 'Tournament'} invitation</CardDescription>
        <div className="flex justify-center gap-2 mb-6"><Badge variant={invite.type === 'LEAGUE' ? 'purple' : 'green'} size="md">{invite.type === 'LEAGUE' ? 'League' : 'Tournament'}</Badge></div>
        <Button onClick={handleJoin} loading={joining} className="w-full">Join {target?.name}</Button>
      </CardContent></Card>
    </div>
  );
}
