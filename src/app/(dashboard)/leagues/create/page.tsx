'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { useDraftStore } from '@/store/draft-store';
import { toast } from 'sonner';

export default function CreateLeaguePage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const { leagueDraft, updateLeagueDraft } = useDraftStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  if (!isLoading && !user) { router.push('/login'); return null; }

  const handleCreate = async () => {
    if (!leagueDraft.name) { toast.error('League name required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/leagues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leagueDraft), credentials: 'include' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success('League created!'); useDraftStore.getState().resetLeagueDraft();
      router.push(`/leagues/${json.data.league._id}`);
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Card><CardHeader><CardTitle>Create League</CardTitle><CardDescription>Set up your competitive league in minutes</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 mb-4">{[1, 2].map((s) => <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-neon-purple' : 'bg-white/10'}`} />)}</div>
          {step === 1 && <div className="space-y-4">
            <Input label="League Name" placeholder="e.g. Premier League, Sunday League" value={leagueDraft.name} onChange={(e) => updateLeagueDraft({ name: e.target.value })} maxLength={50} />
            <Input label="Description (optional)" placeholder="Describe your league..." value={leagueDraft.description} onChange={(e) => updateLeagueDraft({ description: e.target.value })} maxLength={500} />
            <Select label="League Type" value={leagueDraft.type} onChange={(e) => updateLeagueDraft({ type: e.target.value as any })} options={[{ value: 'PRIVATE', label: 'Private — Invite only' }, { value: 'FRIENDS', label: 'Friends — Only friends can join' }, { value: 'PUBLIC', label: 'Public — Anyone can join' }]} />
            <Input label="Region (optional)" placeholder="e.g. Europe, North America" value={leagueDraft.region} onChange={(e) => updateLeagueDraft({ region: e.target.value })} />
            <Button onClick={() => setStep(2)} className="w-full">Next: Settings</Button>
          </div>}
          {step === 2 && <div className="space-y-4">
            <Input label="Max Players" type="number" min={2} max={100} value={leagueDraft.maxPlayers} onChange={(e) => updateLeagueDraft({ maxPlayers: parseInt(e.target.value) || 20 })} />
            <Input label="Number of Rounds" type="number" min={1} max={10} value={leagueDraft.rounds} onChange={(e) => updateLeagueDraft({ rounds: parseInt(e.target.value) || 2 })} />
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={leagueDraft.homeAway} onChange={(e) => updateLeagueDraft({ homeAway: e.target.checked })} className="rounded border-glass-border bg-white/5" /><span className="text-sm">Home & Away matches</span></label>
            <div className="glass rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-2">Preview</h4>
              <div className="space-y-1 text-sm text-muted">
                <p>Name: <span className="text-foreground">{leagueDraft.name || 'Untitled League'}</span></p>
                <p>Type: <Badge variant={leagueDraft.type === 'PUBLIC' ? 'green' : 'purple'} size="sm">{leagueDraft.type}</Badge></p>
                <p>Max Players: {leagueDraft.maxPlayers} | Rounds: {leagueDraft.rounds} ({leagueDraft.homeAway ? 'Home & Away' : 'Single'})</p>
              </div>
            </div>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button><Button onClick={handleCreate} loading={loading} className="flex-1">Create League</Button></div>
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
