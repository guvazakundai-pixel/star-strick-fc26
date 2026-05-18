import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { ACHIEVEMENTS } from "@/lib/achievements";

const PLATFORMS = ["CROSSPLAY", "PS5", "XBOX", "PC"] as const;

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "letters, numbers, underscores only"),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(3).max(30),
  platform: z.enum(PLATFORMS).default("CROSSPLAY"),
  phone: z.string().max(30).optional().default(""),
  whatsapp: z.string().max(30).optional().default(""),
});

export async function POST(req: Request) {
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
      { status: 400 }
    );
  }
  const { username, email, password, displayName, platform, phone, whatsapp } = parsed.data;

  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
    args: [username, email],
  });
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "An account with that username or email already exists. Try signing in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const totalRow = await db.execute("SELECT count(*) as c FROM player_rankings");
  const startingRank = Number(totalRow.rows[0]?.c ?? 0) + 1;

  const statsId = crypto.randomUUID();
  const rankingId = crypto.randomUUID();
  const achievementId = crypto.randomUUID();
  const welcome = ACHIEVEMENTS.WELCOME;

  await db.batch(
    [
      {
        sql: "INSERT INTO users (id, username, email, password_hash, display_name, platform, phone, whatsapp, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PLAYER', ?, ?)",
        args: [id, username, email, passwordHash, displayName, platform, phone || null, whatsapp || null, now, now],
      },
      {
        sql: "INSERT INTO player_stats (id, user_id, matches_played, wins, losses, draws, goals_scored, goals_conceded, skill_rating, points, form_score, win_streak, mvp_count, form_history, updated_at) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 1000, 0, 0, 0, 0, '', ?)",
        args: [statsId, id, now],
      },
      {
        sql: "INSERT INTO player_rankings (id, user_id, rank_position, rank_change, points, final_score, updated_at) VALUES (?, ?, ?, 0, 0, 0, ?)",
        args: [rankingId, id, startingRank, now],
      },
      {
        sql: "INSERT INTO player_achievements (id, user_id, title, description, icon, category, rarity, unlocked_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [achievementId, id, welcome.title, welcome.description, welcome.icon, welcome.category, welcome.rarity, now, now],
      },
    ],
    "write",
  );

  await setSessionCookie({ userId: id, username, role: "PLAYER" });

  return NextResponse.json({
    user: { id, username, email, role: "PLAYER", displayName, platform },
  });
}