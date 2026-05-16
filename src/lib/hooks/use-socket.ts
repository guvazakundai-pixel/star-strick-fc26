'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';

export function useSocket() {
  const ref = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', { auth: { token }, transports: ['websocket', 'polling'] });
    ref.current = socket;
    return () => { socket.disconnect(); ref.current = null; };
  }, [token]);

  const emit = useCallback((event: string, data?: any) => ref.current?.emit(event, data), []);
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    ref.current?.on(event, handler);
    return () => ref.current?.off(event, handler);
  }, []);

  return { socket: ref.current, emit, on };
}
