type MatchResult = "win" | "loss" | "draw";

export type XPCalculation = {
  winnerId: string;
  loserId: string;
  winnerNewRating: number;
  loserNewRating: number;
  winnerXPGain: number;
  loserXPLoss: number;
  winnerPointsGain: number;
  loserPointsGain: number;
  bonuses: {
    giantSlayer: number;
    cleanSheet: number;
    goalMargin: number;
    winStreak: number;
  };
  description: string;
};

const K_FACTOR = 32;
const PROVISIONAL_K = 40;
const MIN_RATING = 100;
const BASE_WIN_XP = 25;
const BASE_LOSS_XP = 5;
const GIANT_SLAYER_MULTIPLIER = 2.5;
const GIANT_SLAYER_THRESHOLD = 200;
const CLEAN_SHEET_BONUS = 5;
const GOAL_MARGIN_BONUS = 5;
const GOAL_MARGIN_THRESHOLD = 3;
const WIN_STREAK_BONUS_PER_STREAK = 3;
const MAX_WIN_STREAK_BONUS = 15;

export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  scoreB: number,
  provisionalThreshold: number = 10,
): {
  newRatingA: number;
  newRatingB: number;
  deltaA: number;
  deltaB: number;
  expectedA: number;
  expectedB: number;
} {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  let resultA: number;
  if (scoreA > scoreB) resultA = 1;
  else if (scoreA < scoreB) resultA = 0;
  else resultA = 0.5;

  const kA = ratingA < 1000 || provisionalThreshold < 10 ? PROVISIONAL_K : K_FACTOR;
  const kB = ratingB < 1000 || provisionalThreshold < 10 ? PROVISIONAL_K : K_FACTOR;

  const deltaA = Math.round(kA * (resultA - expectedA));
  const deltaB = Math.round(kB * ((1 - resultA) - expectedB));

  return {
    newRatingA: Math.max(MIN_RATING, ratingA + deltaA),
    newRatingB: Math.max(MIN_RATING, ratingB + deltaB),
    deltaA,
    deltaB,
    expectedA,
    expectedB,
  };
}

export function calculateXPAndPoints(
  winnerRating: number,
  loserRating: number,
  winnerScore: number,
  loserScore: number,
  winnerId: string,
  loserId: string,
  winnerCurrentStreak: number = 0,
  winnerCurrentPoints: number = 0,
  loserCurrentPoints: number = 0,
  winnerMatchCount: number = 0,
  loserMatchCount: number = 0,
): XPCalculation {
  const ratingDiff = winnerRating - loserRating;
  const isGiantSlayer = ratingDiff < -GIANT_SLAYER_THRESHOLD;

  let baseXPGain = BASE_WIN_XP;
  let baseXPLoss = BASE_LOSS_XP;

  if (ratingDiff > 300) {
    baseXPGain = 5;
    baseXPLoss = 5;
  } else if (ratingDiff > 150) {
    baseXPGain = 12;
    baseXPLoss = 5;
  } else if (ratingDiff > 0) {
    baseXPGain = 18;
    baseXPLoss = 8;
  } else if (ratingDiff > -150) {
    baseXPGain = 25;
    baseXPLoss = 10;
  } else if (ratingDiff > -300) {
    baseXPGain = 32;
    baseXPLoss = 12;
  } else {
    baseXPGain = 40;
    baseXPLoss = 14;
  }

  let giantSlayerBonus = 0;
  if (isGiantSlayer) {
    giantSlayerBonus = Math.round(baseXPGain * (GIANT_SLAYER_MULTIPLIER - 1));
  }

  const isCleanSheet = loserScore === 0;
  const cleanSheetBonus = isCleanSheet ? CLEAN_SHEET_BONUS : 0;

  const goalDiff = winnerScore - loserScore;
  const goalMarginBonus = goalDiff >= GOAL_MARGIN_THRESHOLD ? GOAL_MARGIN_BONUS : 0;

  let winStreakBonus = 0;
  if (winnerCurrentStreak >= 3) {
    winStreakBonus = Math.min(winnerCurrentStreak * WIN_STREAK_BONUS_PER_STREAK, MAX_WIN_STREAK_BONUS);
  }

  const winnerXPGain = baseXPGain + giantSlayerBonus + cleanSheetBonus + goalMarginBonus + winStreakBonus;
  const loserXPLoss = -baseXPLoss;

  const winnerPointsGain = winnerScore * 3 + winnerXPGain;
  const loserPointsGain = loserScore * 1 + Math.abs(loserXPLoss) * 0.1;

  const elo = calculateElo(winnerRating, loserRating, winnerScore, loserScore, winnerMatchCount);

  const bonuses = [
    giantSlayerBonus > 0 ? `Giant Slayer +${giantSlayerBonus}` : null,
    cleanSheetBonus > 0 ? `Clean Sheet +${cleanSheetBonus}` : null,
    goalMarginBonus > 0 ? `Dominant Win (+${goalDiff}) +${goalMarginBonus}` : null,
    winStreakBonus > 0 ? `Win Streak (${winnerCurrentStreak}W) +${winStreakBonus}` : null,
  ].filter(Boolean).join(" · ");

  const description = isGiantSlayer
    ? `Giant Slayer! #${winnerId} defeated #${loserId} (${winnerScore}-${loserScore}). Massive upset earns +${winnerXPGain} XP.`
    : `#${winnerId} defeated #${loserId} (${winnerScore}-${loserScore}). +${winnerXPGain} XP.`;

  return {
    winnerId,
    loserId,
    winnerNewRating: elo.newRatingA,
    loserNewRating: elo.newRatingB,
    winnerXPGain,
    loserXPLoss,
    winnerPointsGain: Math.round(winnerPointsGain),
    loserPointsGain: Math.round(loserPointsGain),
    bonuses: {
      giantSlayer: giantSlayerBonus,
      cleanSheet: cleanSheetBonus,
      goalMargin: goalMarginBonus,
      winStreak: winStreakBonus,
    },
    description: bonuses ? `${description} Bonuses: ${bonuses}` : description,
  };
}

export function simulateXPReport(
  p1Name: string,
  p2Name: string,
  p1Rating: number,
  p2Rating: number,
  p1Score: number,
  p2Score: number,
  p1Streak: number = 0,
  p1Points: number = 0,
  p2Points: number = 0,
  p1Matches: number = 0,
  p2Matches: number = 0,
): string {
  if (p1Score === p2Score) {
    const elo = calculateElo(p1Rating, p2Rating, p1Score, p2Score);
    return `Draw between ${p1Name} and ${p2Name} (${p1Score}-${p2Score}). ${p1Name}: ${elo.deltaA >= 0 ? "+" : ""}${elo.deltaA} SR. ${p2Name}: ${elo.deltaB >= 0 ? "+" : ""}${elo.deltaB} SR.`;
  }

  const winnerName = p1Score > p2Score ? p1Name : p2Name;
  const loserName = p1Score > p2Score ? p2Name : p1Name;
  const winnerRating = p1Score > p2Score ? p1Rating : p2Rating;
  const loserRating = p1Score > p2Score ? p2Rating : p1Rating;
  const winnerId = p1Score > p2Score ? "P1" : "P2";
  const loserId = p1Score > p2Score ? "P2" : "P1";
  const winnerStreak = p1Score > p2Score ? p1Streak : 0;
  const wPoints = p1Score > p2Score ? p1Points : p2Points;
  const lPoints = p1Score > p2Score ? p2Points : p1Points;
  const wMatches = p1Score > p2Score ? p1Matches : p2Matches;
  const lMatches = p1Score > p2Score ? p2Matches : p1Matches;
  const scoreHigh = Math.max(p1Score, p2Score);
  const scoreLow = Math.min(p1Score, p2Score);

  const result = calculateXPAndPoints(
    winnerRating, loserRating,
    scoreHigh, scoreLow,
    winnerId, loserId,
    winnerStreak, wPoints, lPoints, wMatches, lMatches,
  );

  const ratingDiff = winnerRating - loserRating;
  const isUpset = ratingDiff < -200;

  let summary = `${winnerName} defeats ${loserName} ${scoreHigh}-${scoreLow}.`;
  summary += ` ${winnerName} earns +${result.winnerXPGain} XP, ${loserName} ${result.loserXPLoss} XP.`;
  summary += ` Rating: ${winnerName} ${result.winnerNewRating} SR, ${loserName} ${result.loserNewRating} SR.`;

  if (result.bonuses.giantSlayer > 0) summary += ` | Giant Slayer +${result.bonuses.giantSlayer}!`;
  if (result.bonuses.cleanSheet > 0) summary += ` | Clean Sheet +${result.bonuses.cleanSheet}!`;
  if (result.bonuses.goalMargin > 0) summary += ` | Dominant +${result.bonuses.goalMargin}!`;
  if (result.bonuses.winStreak > 0) summary += ` | Streak +${result.bonuses.winStreak}!`;

  return summary;
}