/**
 * Convert lifetime points to a player level using a soft polynomial curve:
 *   points needed for level N = 100 * N^1.5
 * Early levels come fast; high levels take real grinding.
 *
 * Level 1: 100 pts
 * Level 5: ~1118 pts
 * Level 10: ~3162 pts
 * Level 25: ~12500 pts
 * Level 50: ~35355 pts
 * Level 100: ~100000 pts
 */
export function levelFromPoints(points: number): {
  level: number;
  intoLevel: number;
  needed: number;
  pct: number;
} {
  const p = Math.max(0, points);
  const level = Math.max(1, Math.floor(Math.pow(p / 100, 1 / 1.5)) + 1);
  const currentThreshold = pointsForLevel(level);
  const nextThreshold = pointsForLevel(level + 1);
  const span = nextThreshold - currentThreshold;
  const intoLevel = p - currentThreshold;
  return {
    level,
    intoLevel,
    needed: nextThreshold - p,
    pct: Math.min(100, Math.max(0, Math.round((intoLevel / span) * 100))),
  };
}

export function pointsForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}
