import { PLAYERS, type Player, CITIES } from "./players";

/* ─── Form Sparkline ─── */
export type SparklineBar = { result: "W" | "L" | "D"; width: number };
export function formSparkline(form: Player["form"], maxBars = 10): SparklineBar[] {
  const recent = form.slice(-maxBars);
  return recent.map((r) => ({ result: r, width: 100 / Math.min(recent.length, maxBars) }));
}

/* ─── Player of the Week ─── */
export function playerOfTheWeek(): Player | null {
  let best: Player | null = null;
  let bestScore = -Infinity;
  for (const p of PLAYERS) {
    const recentWins = p.form.filter((r) => r === "W").length;
    const score = recentWins * 10 + p.winStreak * 5 + Math.round(p.gpm * 20);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

/* ─── Most Improved / Biggest Faller ─── */
export type MovementPlayer = { player: Player; delta: number };
export function mostImproved(limit = 3): MovementPlayer[] {
  return [...PLAYERS]
    .filter((p) => p.prev - p.rank > 0)
    .sort((a, b) => (b.prev - b.rank) - (a.prev - a.rank))
    .slice(0, limit)
    .map((p) => ({ player: p, delta: p.prev - p.rank }));
}
export function biggestFallers(limit = 3): MovementPlayer[] {
  return [...PLAYERS]
    .filter((p) => p.rank - p.prev > 0)
    .sort((a, b) => (b.rank - b.prev) - (a.rank - a.prev))
    .slice(0, limit)
    .map((p) => ({ player: p, delta: p.rank - p.prev }));
}

/* ─── City Rivalry ─── */
export type CityRivalry = { city: string; totalPlayers: number; totalWins: number; totalPoints: number; avgGpm: number };
export function cityRivalries(): CityRivalry[] {
  return CITIES.map((city) => {
    const players = PLAYERS.filter((p) => p.city === city);
    const totalWins = players.reduce((s, p) => s + p.wins, 0);
    const totalPoints = players.reduce((s, p) => s + p.points, 0);
    const avgGpm = players.length > 0 ? players.reduce((s, p) => s + p.gpm, 0) / players.length : 0;
    return { city, totalPlayers: players.length, totalWins, totalPoints, avgGpm: Math.round(avgGpm * 100) / 100 };
  }).sort((a, b) => b.totalPoints - a.totalPoints);
}

/* ─── Radar Data ─── */
export type RadarMetric = { label: string; value: number; max: number };
export function radarData(p: Player): RadarMetric[] {
  const matches = p.wins + p.losses + p.draws;
  const winRate = matches > 0 ? (p.wins / matches) * 100 : 0;
  const offense = Math.min(100, Math.round((p.gpm / 4) * 40 + (winRate / 100) * 30 + Math.min(p.winStreak, 15) / 15 * 30));
  const defense = Math.min(100, Math.round((1 - p.goalsAgainst / Math.max(p.goalsFor, 1)) * 35 + (matches > 0 ? (1 - p.losses / matches) : 0.5) * 35 + (p.draws > 0 ? 30 : 20)));
  const control = Math.min(100, Math.round((winRate / 100) * 40 + ((p.goalsFor - p.goalsAgainst) / Math.max(p.goalsFor, 1)) * 25 + (p.draws / Math.max(matches, 1)) * 15 + (matches > 10 ? 20 : matches * 2)));
  const consistency = Math.min(100, Math.round((p.form.filter((r) => r === "W").length / Math.max(p.form.length, 1)) * 60 + (p.winStreak > 0 ? Math.min(p.winStreak, 10) * 4 : 0)));
  const clutch = Math.min(100, Math.round((p.goalsFor - p.goalsAgainst > 0 ? 40 : 0) + (p.draws / Math.max(matches, 1)) * 30 + (p.winStreak >= 3 ? 30 : 0)));
  return [
    { label: "OFFENSE", value: offense, max: 100 },
    { label: "DEFENSE", value: defense, max: 100 },
    { label: "CONTROL", value: control, max: 100 },
    { label: "CONSISTENCY", value: consistency, max: 100 },
    { label: "CLUTCH", value: clutch, max: 100 },
  ];
}

/* ─── H2H (mock — uses static data) ─── */
export type H2HRecord = { playerAId: string; playerBId: string; aWins: number; bWins: number; draws: number };
const h2hStore = new Map<string, H2HRecord>();
export function getH2H(a: Player, b: Player): H2HRecord {
  const key = [a.id, b.id].sort().join(":");
  if (h2hStore.has(key)) return h2hStore.get(key)!;
  const record: H2HRecord = {
    playerAId: a.id,
    playerBId: b.id,
    aWins: Math.floor(Math.random() * 5),
    bWins: Math.floor(Math.random() * 5),
    draws: Math.floor(Math.random() * 3),
  };
  h2hStore.set(key, record);
  return record;
}

/* ─── Matchup Predictor ─── */
export type MatchupPrediction = {
  aWinProb: number;
  bWinProb: number;
  drawProb: number;
  verdict: string;
};
export function predictMatchup(a: Player, b: Player): MatchupPrediction {
  const aScore = a.points * 0.4 + a.gpm * 80 + a.winStreak * 10 + (a.form.filter((r) => r === "W").length / a.form.length) * 30;
  const bScore = b.points * 0.4 + b.gpm * 80 + b.winStreak * 10 + (b.form.filter((r) => r === "W").length / b.form.length) * 30;
  const total = aScore + bScore;
  if (total === 0) return { aWinProb: 33, bWinProb: 33, drawProb: 34, verdict: "Too close to call" };
  const aRaw = (aScore / total) * 100;
  const bRaw = (bScore / total) * 100;
  const aWinProb = Math.round(Math.min(85, Math.max(5, aRaw)));
  const bWinProb = Math.round(Math.min(85, Math.max(5, bRaw)));
  const drawProb = 100 - aWinProb - bWinProb;
  const diff = Math.abs(aWinProb - bWinProb);
  let verdict: string;
  if (diff < 8) verdict = "Too close to call — expect a tight match";
  else if (aWinProb > bWinProb) verdict = `${a.gamertag} is favored (${aWinProb}% win probability)`;
  else verdict = `${b.gamertag} is favored (${bWinProb}% win probability)`;
  return { aWinProb, bWinProb, drawProb, verdict };
}

/* ─── Elo Tier Title ─── */
export function eloTierTitle(points: number): string {
  if (points >= 3000) return "Elite Gladiator";
  if (points >= 2500) return "Pro Contender";
  if (points >= 2000) return "Challenger Rising";
  return "Rookie Prospect";
}

export function eloTierEmoji(points: number): string {
  if (points >= 3000) return "👑";
  if (points >= 2500) return "⭐";
  if (points >= 2000) return "🔥";
  return "💪";
}
