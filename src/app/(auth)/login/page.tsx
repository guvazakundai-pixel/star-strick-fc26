'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'include' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error || 'Login failed'); return; }
      setUser(json.data.user); setToken(json.data.token);
      toast.success('Welcome back!'); router.push('/dashboard');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/5 via-transparent to-transparent pointer-events-none" />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-electric-green flex items-center justify-center font-bold text-white text-lg mx-auto mb-3">S</div>
          <CardTitle>Welcome back</CardTitle><CardDescription>Log in to your STAR STRICK account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input id="password" label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" loading={loading}>Log in</Button>
          </form>
          <p className="text-center text-sm text-muted mt-4">Don&apos;t have an account? <Link href="/signup" className="text-neon-purple hover:underline">Sign up</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
