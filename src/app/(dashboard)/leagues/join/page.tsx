'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export default function JoinLeaguePage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [code, setCode] = useState(''); const [loading, setLoading] = useState(false);
  if (!isLoading && !user) { router.push('/login'); return null; }

  const handleJoin = async () => {
    if (!code.trim()) { toast.error('Enter code'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${code.toUpperCase()}`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (json.success) { toast.success('Joined!'); router.push('/dashboard'); } else toast.error(json.error);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <Card><CardHeader className="text-center"><CardTitle>Join a League</CardTitle><CardDescription>Enter the invite code to join</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Invite code (e.g. ABC1234)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} className="text-center text-lg font-bold tracking-widest uppercase" />
          <Button onClick={handleJoin} loading={loading} className="w-full">Join League</Button>
        </CardContent>
      </Card>
    </div>
  );
}
