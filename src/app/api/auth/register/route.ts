import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { sendEmail, renderWelcomeEmail, renderVerificationEmail } from "@/lib/email";
import { getDivisionForSkillRating } from "@/lib/divisions";
import { sanitizeInput } from "@/lib/sanitize";
import { recomputePlayerRankings } from "@/lib/ranking";

const ZIMBABWEAN_CLUBS = [
  "Caps United", "Dynamos", "Highlanders", "ZPC Kariba",
  "Chicken Inn", "Ngezi Platinum", "Bulawayo Chiefs",
  "GreenFuel", "Manica Diamonds", "Herentals",
  "TelOne", "Black Rhinos", "Yadah", "Hwange",
  "Sheasham", "Arenel Movers", "Mwana Africa", "Simba Bhora",
  "Bikita Minerals", "Chegutu Pirates",
] as const;

const PLATFORMS = ["PS5", "XBOX", "PC"] as const;

const RegisterSchema = z.object({
  fullName: z.string().max(100).optional().default(""),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  confirmPassword: z.string(),
  platform: z.enum(PLATFORMS).default("PS5"),
  country: z.string().max(60).default("Zimbabwe"),
  favoriteClub: z.string().max(60).optional().default(""),
  phone: z.string().max(20).optional().default(""),
  dateOfBirth: z.string().optional().default(""),
  termsAccepted: z.boolean().refine((v) => v === true, "You must accept the terms"),
  referralCode: z.string().max(20).optional().default(""),
  allowEmailChallenges: z.boolean().optional().default(true),
  allowPhoneChallenges: z.boolean().optional().default(false),
  allowDirectMessages: z.boolean().optional().default(true),
  allowClubInvites: z.boolean().optional().default(true),
  allowTournamentInvites: z.boolean().optional().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function generateReferralCode(username: string): string {
  const prefix = username.slice(0, 5).toUpperCase();
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${prefix}${suffix}`;
}

export async function POST(req: Request) {
  try {
  const rlKey = rateLimitKey(req, "register");
  const rl = rateLimit(rlKey, { windowMs: 60 * 60 * 1000, max: 5 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { fullName, username, email, password, platform, country, favoriteClub, phone, dateOfBirth, referralCode, allowEmailChallenges, allowPhoneChallenges, allowDirectMessages, allowClubInvites, allowTournamentInvites } = parsed.data;

  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
    args: [username, email],
  });
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "An account with that username or email already exists. Try signing in instead." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const totalRow = await db.execute("SELECT count(*) as c FROM player_rankings");
  const playerCount = Number(totalRow.rows[0]?.c ?? 0);
  const startingRank = playerCount + 1;

  let referrerId: string | null = null;
  if (referralCode) {
    const referrerRow = await db.execute({
      sql: "SELECT id FROM users WHERE referral_code = ? LIMIT 1",
      args: [referralCode.toUpperCase()],
    });
    if (referrerRow.rows.length > 0) {
      referrerId = (referrerRow.rows[0] as Record<string, unknown>).id as string;
    }
  }

  const code = generateReferralCode(username);

  const verificationToken = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const statsId = crypto.randomUUID();
  const rankingId = crypto.randomUUID();
  const achievementId = crypto.randomUUID();
  const teamId = crypto.randomUUID();

  const sanitizedFullName = sanitizeInput(fullName || username);
  const sanitizedFavoriteClub = sanitizeInput(favoriteClub || "");
  const sanitizedPhone = sanitizeInput(phone || "");
  const dob = dateOfBirth ? new Date(dateOfBirth).toISOString() : null;
  const displayName = sanitizedFullName;

  // Insert user (critical)
  await db.execute({
    sql: `INSERT INTO users (
      id, username, email, password_hash, display_name, full_name,
      platform, country, favorite_club, phone, date_of_birth,
      terms_accepted, terms_accepted_at, role, referral_code, referred_by,
      referral_xp, referral_count, verification_token, verification_token_expiry,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'PLAYER', ?, ?, 0, 0, ?, ?, ?, ?)`,
    args: [
      id, username, email, passwordHash, displayName, sanitizedFullName,
      platform, country, sanitizedFavoriteClub, sanitizedPhone, dob,
      now, code, referrerId, verificationToken, verificationTokenExpiry, now, now,
    ],
  });

  // Insert player stats (critical for rankings)
  await db.execute({
    sql: "INSERT INTO player_stats (id, user_id, matches_played, wins, losses, draws, goals_scored, goals_conceded, skill_rating, points, form_score, win_streak, mvp_count, form_history, updated_at) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 1000, 0, 0, 0, 0, '', ?)",
    args: [statsId, id, now],
  });

  // Insert ranking (critical)
  await db.execute({
    sql: "INSERT INTO player_rankings (id, user_id, rank_position, prev_position, rank_change, points, final_score, updated_at) VALUES (?, ?, ?, NULL, 0, 0, 0, ?)",
    args: [rankingId, id, startingRank, now],
  });

  // Insert fantasy team (non-critical — don't fail registration if this errors)
  try {
    await db.execute({
      sql: "INSERT INTO fantasy_teams (id, user_id, team_name, manager_name, budget, team_value, transfers_used, formation, created_at, updated_at) VALUES (?, ?, ?, ?, 100.0, 0, 0, '4-3-3', ?, ?)",
      args: [teamId, id, `${username} FC`, displayName, now, now],
    });
  } catch (e) {
    console.error("[Register] Fantasy team creation failed (non-critical):", e);
  }

  // Insert welcome achievement (non-critical)
  try {
    await db.execute({
      sql: "INSERT INTO player_achievements (id, user_id, title, description, icon, category, rarity, unlocked_at, created_at) VALUES (?, ?, 'Welcome to zimfcpro', 'Joined the competitive ecosystem.', '🎮', 'GENERAL', 'COMMON', ?, ?)",
      args: [achievementId, id, now, now],
    });
  } catch (e) {
    console.error("[Register] Achievement creation failed (non-critical):", e);
  }

  try {
    await recomputePlayerRankings();
  } catch (e) {
    console.error("[Register] Ranking recomputation failed (non-critical):", e);
  }

  if (referrerId) {
    try {
      await db.execute({
        sql: "UPDATE users SET referral_xp = COALESCE(referral_xp, 0) + 10, referral_count = COALESCE(referral_count, 0) + 1 WHERE id = ?",
        args: [referrerId],
      });
    } catch {}
  }

  await setSessionCookie({ userId: id, username, role: "PLAYER" });

  const division = getDivisionForSkillRating(1000);
  const welcomeUrl = `${process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw"}/join/${code}`;
  const verifyUrl = `${process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw"}/verify?token=${verificationToken}`;

  try {
    await sendEmail({
      to: email,
      subject: "Welcome to ZimFC Pro — Your Competitive Journey Starts Now",
      html: renderWelcomeEmail({
        username,
        displayName: sanitizedFullName,
        globalRank: startingRank,
        division,
        referralCode: code,
        referralLink: welcomeUrl,
        platform,
      }),
    });
  } catch (err) {
    console.error(`[Register] Failed to send welcome email to ${email}:`, err);
  }

  try {
    await sendEmail({
      to: email,
      subject: "Verify your ZimFC Pro account",
      html: renderVerificationEmail({ username: sanitizedFullName, verifyUrl }),
    });
  } catch (err) {
    console.error(`[Register] Failed to send verification email to ${email}:`, err);
  }

  return NextResponse.json({
    user: {
      id,
      username,
      email,
      displayName: sanitizedFullName,
      role: "PLAYER",
      platform,
      country,
      favoriteClub: sanitizedFavoriteClub,
      fantasyTeam: {
        teamName: `${username} FC`,
        budget: 100.0,
        transfersUsed: 0,
      },
    },
    welcome: {
      globalRank: startingRank,
      totalPlayers: playerCount + 1,
      division,
      referralCode: code,
      referralLink: welcomeUrl,
      platform,
      xp: 0,
      teamName: `${username} FC`,
    },
  });
  } catch (err: any) {
    console.error("[Register] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message || "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
