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

export default function CreateTournamentPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const { tournamentDraft, updateTournamentDraft } = useDraftStore();
  const [loading, setLoading] = useState(false); const [step, setStep] = useState(1);

  if (!isLoading && !user) { router.push('/login'); return null; }

  const handleCreate = async () => {
    if (!tournamentDraft.name) { toast.error('Name required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/tournaments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tournamentDraft), credentials: 'include' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success('Tournament created!'); useDraftStore.getState().resetTournamentDraft();
      router.push(`/tournaments/${json.data.tournament._id}`);
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Card><CardHeader><CardTitle>Create Tournament</CardTitle><CardDescription>Set up your tournament in minutes</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 mb-4">{[1, 2].map((s) => <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-neon-purple' : 'bg-white/10'}`} />)}</div>
          {step === 1 && <div className="space-y-4">
            <Input label="Tournament Name" placeholder="e.g. Champions Cup" value={tournamentDraft.name} onChange={(e) => updateTournamentDraft({ name: e.target.value })} maxLength={50} />
            <Input label="Description (optional)" placeholder="Describe..." value={tournamentDraft.description} onChange={(e) => updateTournamentDraft({ description: e.target.value })} maxLength={500} />
            <Select label="Type" value={tournamentDraft.type} onChange={(e) => updateTournamentDraft({ type: e.target.value as any })} options={[{ value: 'PUBLIC', label: 'Public' }, { value: 'PRIVATE', label: 'Private' }, { value: 'INVITE_ONLY', label: 'Invite Only' }]} />
            <Select label="Format" value={tournamentDraft.format} onChange={(e) => updateTournamentDraft({ format: e.target.value as any })} options={[{ value: 'KNOCKOUT', label: 'Knockout' }, { value: 'GROUP_STAGE', label: 'Group Stage' }, { value: 'HYBRID', label: 'Hybrid' }, { value: 'DOUBLE_ELIMINATION', label: 'Double Elimination' }]} />
            <Button onClick={() => setStep(2)} className="w-full">Next: Settings</Button>
          </div>}
          {step === 2 && <div className="space-y-4">
            <Input label="Max Players" type="number" min={2} max={128} value={tournamentDraft.maxPlayers} onChange={(e) => updateTournamentDraft({ maxPlayers: parseInt(e.target.value) || 16 })} />
            {(tournamentDraft.format === 'GROUP_STAGE' || tournamentDraft.format === 'HYBRID') && <Input label="Players per Group" type="number" min={2} max={8} value={tournamentDraft.groupSize} onChange={(e) => updateTournamentDraft({ groupSize: parseInt(e.target.value) || 4 })} />}
            <Input label="Best Of" type="number" min={1} max={7} value={tournamentDraft.bestOf} onChange={(e) => updateTournamentDraft({ bestOf: parseInt(e.target.value) || 1 })} />
            <div className="glass rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-2">Preview</h4>
              <div className="space-y-1 text-sm text-muted">
                <p>Name: <span className="text-foreground">{tournamentDraft.name || 'Untitled'}</span> | Format: <Badge variant="purple" size="sm">{tournamentDraft.format}</Badge></p>
                <p>Max Players: {tournamentDraft.maxPlayers} | Best Of: {tournamentDraft.bestOf}</p>
              </div>
            </div>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button><Button onClick={handleCreate} loading={loading} className="flex-1">Create Tournament</Button></div>
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
