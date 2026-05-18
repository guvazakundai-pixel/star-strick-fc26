export type DivisionTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "ELITE"
  | "CHAMPION"
  | "LEGENDARY";

export type Division = {
  tier: DivisionTier;
  label: string;
  minElo: number;
  maxElo: number | null;
  color: string;
  badge: string;
};

const TABLE: Division[] = [
  { tier: "BRONZE",    label: "Bronze",    minElo: 0,    maxElo: 899,   color: "#a16245", badge: "🟫" },
  { tier: "SILVER",    label: "Silver",    minElo: 900,  maxElo: 1099,  color: "#9ca3af", badge: "⬜" },
  { tier: "GOLD",      label: "Gold",      minElo: 1100, maxElo: 1299,  color: "#facc15", badge: "🟨" },
  { tier: "PLATINUM",  label: "Platinum",  minElo: 1300, maxElo: 1499,  color: "#22d3ee", badge: "🟦" },
  { tier: "DIAMOND",   label: "Diamond",   minElo: 1500, maxElo: 1699,  color: "#60a5fa", badge: "💎" },
  { tier: "ELITE",     label: "Elite",     minElo: 1700, maxElo: 1899,  color: "#a78bfa", badge: "🟪" },
  { tier: "CHAMPION",  label: "Champion",  minElo: 1900, maxElo: 2099,  color: "#f97316", badge: "🟧" },
  { tier: "LEGENDARY", label: "Legendary", minElo: 2100, maxElo: null,  color: "#ef4444", badge: "👑" },
];

export function divisionFromElo(elo: number): Division {
  for (const div of TABLE) {
    if (elo >= div.minElo && (div.maxElo === null || elo <= div.maxElo)) return div;
  }
  return TABLE[0];
}

export function nextDivision(current: Division): Division | null {
  const idx = TABLE.findIndex((d) => d.tier === current.tier);
  return idx >= 0 && idx < TABLE.length - 1 ? TABLE[idx + 1] : null;
}

export function progressToNext(elo: number): { pct: number; into: number; needed: number } {
  const div = divisionFromElo(elo);
  if (div.maxElo === null) return { pct: 100, into: 0, needed: 0 };
  const span = div.maxElo - div.minElo + 1;
  const into = Math.max(0, elo - div.minElo);
  return { pct: Math.min(100, Math.round((into / span) * 100)), into, needed: span - into };
}

export const ALL_DIVISIONS = TABLE;
