'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LeagueDraft { name: string; description: string; type: 'PUBLIC' | 'PRIVATE' | 'FRIENDS'; region: string; maxPlayers: number; rounds: number; homeAway: boolean; }
interface TournamentDraft { name: string; description: string; type: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'; format: 'KNOCKOUT' | 'GROUP_STAGE' | 'DOUBLE_ELIMINATION' | 'HYBRID'; maxPlayers: number; groupSize: number; bestOf: number; }

const defaultLeague: LeagueDraft = { name: '', description: '', type: 'PRIVATE', region: '', maxPlayers: 20, rounds: 2, homeAway: true };
const defaultTournament: TournamentDraft = { name: '', description: '', type: 'PUBLIC', format: 'KNOCKOUT', maxPlayers: 16, groupSize: 4, bestOf: 1 };

export const useDraftStore = create<{ leagueDraft: LeagueDraft; tournamentDraft: TournamentDraft; updateLeagueDraft: (d: Partial<LeagueDraft>) => void; updateTournamentDraft: (d: Partial<TournamentDraft>) => void; resetLeagueDraft: () => void; resetTournamentDraft: () => void; }>()(persist((set) => ({
  leagueDraft: defaultLeague, tournamentDraft: defaultTournament,
  updateLeagueDraft: (d) => set((s) => ({ leagueDraft: { ...s.leagueDraft, ...d } })),
  updateTournamentDraft: (d) => set((s) => ({ tournamentDraft: { ...s.tournamentDraft, ...d } })),
  resetLeagueDraft: () => set({ leagueDraft: defaultLeague }),
  resetTournamentDraft: () => set({ tournamentDraft: defaultTournament }),
}), { name: 'draft-storage' }));
