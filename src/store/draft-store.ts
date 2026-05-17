import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LeagueDraft {
  name: string;
  description: string;
  type: "PUBLIC" | "PRIVATE" | "FRIENDS" | "RANKED" | "REGIONAL";
  maxPlayers: number;
  rounds: number;
  homeAway: boolean;
  inviteOnly: boolean;
  region: string;
  minRank: number;
  maxRank: number;
  prizePool: number;
  entryFee: number;
  seasonDuration: number;
  promotedSpots: number;
  relegatedSpots: number;
}

export interface TournamentDraft {
  name: string;
  description: string;
  type: "KNOCKOUT" | "ROUND_ROBIN" | "GROUPS" | "DOUBLE_ELIM" | "HYBRID" | "SWISS";
  maxPlayers: number;
  prizePool: number;
  entryFee: number;
  platform: string;
  city: string;
  groupStage: boolean;
  groupCount: number;
  qualifiedPerGroup: number;
  bestOf: number;
  homeAway: boolean;
  seeding: "RANDOM" | "RANKED" | "MANUAL";
  registrationDeadline: string;
  startDate: string;
  visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  minRank: number;
  maxRank: number;
  allowDraws: boolean;
  thirdPlace: boolean;
}

interface DraftStore {
  leagueDraft: LeagueDraft | null;
  tournamentDraft: TournamentDraft | null;
  setLeagueDraft: (draft: Partial<LeagueDraft>) => void;
  setTournamentDraft: (draft: Partial<TournamentDraft>) => void;
  clearLeagueDraft: () => void;
  clearTournamentDraft: () => void;
  hasDraft: () => boolean;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      leagueDraft: null,
      tournamentDraft: null,
      setLeagueDraft: (draft) =>
        set({ leagueDraft: { ...(get().leagueDraft || {
          name: "", description: "", type: "PUBLIC", maxPlayers: 20, rounds: 2,
          homeAway: true, inviteOnly: false, region: "All", minRank: 1, maxRank: 9999,
          prizePool: 0, entryFee: 0, seasonDuration: 30, promotedSpots: 2, relegatedSpots: 2
        }), ...draft } }),
      setTournamentDraft: (draft) =>
        set({ tournamentDraft: { ...(get().tournamentDraft || {
          name: "", description: "", type: "KNOCKOUT", maxPlayers: 32, prizePool: 0,
          entryFee: 0, platform: "CROSSPLAY", city: "", groupStage: false, groupCount: 4,
          qualifiedPerGroup: 2, bestOf: 1, homeAway: false, seeding: "RANDOM",
          registrationDeadline: "", startDate: "", visibility: "PUBLIC",
          minRank: 1, maxRank: 9999, allowDraws: false, thirdPlace: false
        }), ...draft } }),
      clearLeagueDraft: () => set({ leagueDraft: null }),
      clearTournamentDraft: () => set({ tournamentDraft: null }),
      hasDraft: () => !!get().leagueDraft || !!get().tournamentDraft,
    }),
    { name: "ss-drafts" },
  ),
);
