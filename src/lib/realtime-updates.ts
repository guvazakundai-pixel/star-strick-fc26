"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";

type EventHandler = (data: any) => void;

export function useRealtime(event: string, handler: EventHandler, deps: any[] = []) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const cb = (data: any) => handlerRef.current(data);
    socket.on(event, cb);
    return () => { socket.off(event, cb); };
  }, [event, ...deps]);
}

export function useRealtimeSubscription(channel: string, event: string, handler: EventHandler) {
  useRealtime(`${channel}:${event}`, handler, [channel, event]);
}

export function emitRealtime(event: string, data?: any) {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit(event, data);
  }
}

export function useStandingsUpdates(leagueId: string, onUpdate: EventHandler) {
  return useRealtimeSubscription(`league:${leagueId}`, "standings", onUpdate);
}

export function useBracketUpdates(tournamentId: string, onUpdate: EventHandler) {
  return useRealtimeSubscription(`tournament:${tournamentId}`, "bracket", onUpdate);
}

export function useMatchUpdates(matchId: string, onUpdate: EventHandler) {
  return useRealtimeSubscription(`match:${matchId}`, "update", onUpdate);
}

export function useClubActivity(clubId: string, onUpdate: EventHandler) {
  return useRealtimeSubscription(`club:${clubId}`, "activity", onUpdate);
}

export function useNotificationUpdates(userId: string, onUpdate: EventHandler) {
  useRealtime("notification", useCallback((data: any) => {
    if (data.userId === userId || !data.userId) onUpdate(data);
  }, [userId, onUpdate]));
}
