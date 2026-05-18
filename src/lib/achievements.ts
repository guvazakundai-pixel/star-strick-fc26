import { prisma } from "@/lib/prisma";

export type AchievementDef = {
  title: string;
  description: string;
  icon: string;
  category: "GENERAL" | "TOURNAMENT" | "LEAGUE" | "CLUB" | "SOCIAL" | "STREAK";
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
};

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  WELCOME: {
    title: "Welcome to zimfcpro",
    description: "Joined the competitive ecosystem.",
    icon: "🎮",
    category: "GENERAL",
    rarity: "COMMON",
  },
  FIRST_WIN: {
    title: "First Win",
    description: "Won your first ranked match.",
    icon: "🥇",
    category: "GENERAL",
    rarity: "COMMON",
  },
  FIRST_LOSS: {
    title: "Learning the Ropes",
    description: "Played your first match (win, lose, or draw — the journey starts here).",
    icon: "🎯",
    category: "GENERAL",
    rarity: "COMMON",
  },
  TEN_MATCHES: {
    title: "Veteran Initiate",
    description: "Played 10 matches.",
    icon: "🛡️",
    category: "GENERAL",
    rarity: "COMMON",
  },
  FIFTY_MATCHES: {
    title: "Battle-Hardened",
    description: "Played 50 matches.",
    icon: "⚔️",
    category: "GENERAL",
    rarity: "RARE",
  },
  HUNDRED_MATCHES: {
    title: "Century Player",
    description: "Played 100 matches.",
    icon: "💯",
    category: "GENERAL",
    rarity: "EPIC",
  },
  STREAK_3: {
    title: "Hat-Trick of Wins",
    description: "Won 3 matches in a row.",
    icon: "🔥",
    category: "STREAK",
    rarity: "COMMON",
  },
  STREAK_5: {
    title: "On Fire",
    description: "Won 5 matches in a row.",
    icon: "🚀",
    category: "STREAK",
    rarity: "RARE",
  },
  STREAK_10: {
    title: "Unstoppable",
    description: "Won 10 matches in a row.",
    icon: "⚡",
    category: "STREAK",
    rarity: "EPIC",
  },
  HUNDRED_GOALS: {
    title: "Goal Machine",
    description: "Scored 100 career goals.",
    icon: "⚽",
    category: "GENERAL",
    rarity: "RARE",
  },
  FIVE_HUNDRED_GOALS: {
    title: "Striker Royalty",
    description: "Scored 500 career goals.",
    icon: "👑",
    category: "GENERAL",
    rarity: "EPIC",
  },
  CLEAN_SHEET_FIRST: {
    title: "Iron Wall",
    description: "Won a match without conceding.",
    icon: "🛡️",
    category: "GENERAL",
    rarity: "COMMON",
  },
  GIANT_SLAYER: {
    title: "Giant Slayer",
    description: "Beat a player rated 200+ above you.",
    icon: "🗡️",
    category: "GENERAL",
    rarity: "RARE",
  },
};

export type AwardContext = {
  newSkillRating?: number;
  goalsScoredThisMatch?: number;
  goalsConcededThisMatch?: number;
  opponentSkillRating?: number;
  isWin?: boolean;
};

/**
 * Award all applicable achievements for a player based on their current stats.
 * Idempotent: relies on @@unique([userId, title]) — repeated calls are no-ops.
 * Returns the titles of newly-unlocked achievements.
 */
export async function checkAndAward(
  userId: string,
  ctx: AwardContext = {},
): Promise<string[]> {
  const stats = await prisma.playerStats.findUnique({ where: { userId } });
  if (!stats) return [];

  const candidates: string[] = [];

  if (stats.matchesPlayed >= 1) candidates.push("FIRST_LOSS");
  if (stats.wins >= 1) candidates.push("FIRST_WIN");
  if (stats.matchesPlayed >= 10) candidates.push("TEN_MATCHES");
  if (stats.matchesPlayed >= 50) candidates.push("FIFTY_MATCHES");
  if (stats.matchesPlayed >= 100) candidates.push("HUNDRED_MATCHES");
  if (stats.winStreak >= 3) candidates.push("STREAK_3");
  if (stats.winStreak >= 5) candidates.push("STREAK_5");
  if (stats.winStreak >= 10) candidates.push("STREAK_10");
  if (stats.goalsScored >= 100) candidates.push("HUNDRED_GOALS");
  if (stats.goalsScored >= 500) candidates.push("FIVE_HUNDRED_GOALS");
  if (ctx.isWin && ctx.goalsConcededThisMatch === 0) candidates.push("CLEAN_SHEET_FIRST");
  if (
    ctx.isWin &&
    ctx.newSkillRating !== undefined &&
    ctx.opponentSkillRating !== undefined &&
    ctx.opponentSkillRating - ctx.newSkillRating >= 200
  ) {
    candidates.push("GIANT_SLAYER");
  }

  return awardMany(userId, candidates);
}

/**
 * Insert achievements that don't yet exist for this user.
 * Skip duplicates using createMany skipDuplicates.
 */
export async function awardMany(userId: string, keys: string[]): Promise<string[]> {
  if (keys.length === 0) return [];
  const defs = keys.map((k) => ACHIEVEMENTS[k]).filter(Boolean);
  if (defs.length === 0) return [];

  const newlyUnlocked: string[] = [];
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    try {
      await prisma.playerAchievement.create({
        data: {
          userId,
          title: def.title,
          description: def.description,
          icon: def.icon,
          category: def.category,
          rarity: def.rarity,
        },
      });
      newlyUnlocked.push(keys[i]);
    } catch (e: unknown) {
      // P2002 = unique-constraint violation on @@unique([userId, title]) — already unlocked, ignore.
      const code = (e as { code?: string })?.code;
      if (code !== "P2002") throw e;
    }
  }
  return newlyUnlocked;
}

/** Welcome shortcut used at registration. */
export async function awardWelcome(userId: string): Promise<void> {
  await awardMany(userId, ["WELCOME"]);
}
