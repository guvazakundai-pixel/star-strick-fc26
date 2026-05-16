'use client';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/navbar';
import { useAuthStore } from '@/store/auth-store';
import { usePathname } from 'next/navigation';

const authPages = ['/login', '/signup'];

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, setLoading } = useAuthStore();
  const pathname = usePathname();
  const isAuthPage = authPages.includes(pathname);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setUser(json.data.user);
          const match = document.cookie.match(/token=([^;]+)/);
          if (match) setToken(match[1]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setUser, setToken, setLoading]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#ededed' },
      }} />
      {!isAuthPage && <Navbar />}
      <main>{children}</main>
    </>
  );
}
