import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const FORMATS = ["KNOCKOUT", "ROUND_ROBIN", "GROUPS"] as const;
const VISIBILITY = ["PUBLIC", "PRIVATE", "INVITE_ONLY"] as const;
const PLATFORMS = ["CROSSPLAY", "PS5", "XBOX", "PC"] as const;

const CreateSchema = z.object({
  name: z.string().min(3).max(60),
  type: z.enum(FORMATS).default("KNOCKOUT"),
  city: z.string().max(30).nullable().optional(),
  platform: z.enum(PLATFORMS).default("CROSSPLAY"),
  maxPlayers: z.number().int().min(4).max(64).default(16),
  entryFee: z.number().int().min(0).max(2000).default(0),
  description: z.string().max(500).optional(),
  startAt: z.string().optional(),
  visibility: z.enum(VISIBILITY).default("PUBLIC"),
  settings: z
    .object({
      halfLengthMinutes: z.number().int().min(2).max(14).default(6),
      gameSpeed: z.enum(["Slow", "Normal", "Fast"]).default("Normal"),
      cameraAngle: z.string().default("Tele Broadcast"),
      squadType: z.enum(["Default", "Custom"]).default("Default"),
    })
    .default({}),
});

export async function GET() {
  const res = await db.execute({
    sql: `SELECT t.id, t.name, t.type, t.status, t.city, t.prize_pool, t.entry_fee, t.creator_fee, t.max_players, t.start_at, t.created_at,
          u.username as organizer_name,
          (SELECT count(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) as player_count
          FROM tournaments t
          LEFT JOIN users u ON u.id = t.organizer_id
          ORDER BY t.created_at DESC
          LIMIT 50`,
    args: [],
  });

  const tournaments = res.rows.map((row: Record<string, unknown>) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    city: row.city ?? null,
    prizePool: Number(row.prize_pool ?? 0),
    entryFee: Number(row.entry_fee ?? 0),
    creatorFee: Number(row.creator_fee ?? 0),
    maxPlayers: Number(row.max_players ?? 16),
    playerCount: Number(row.player_count ?? 0),
    startAt: row.start_at ?? null,
    createdAt: row.created_at,
    organizerName: row.organizer_name ?? "unknown",
  }));

  return NextResponse.json({ tournaments });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const rl = rateLimit(rateLimitKey(req, "create_tournament", auth.session.userId), { windowMs: 60 * 60 * 1000, max: 3 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many tournaments. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, type, city, platform, maxPlayers, entryFee, description, startAt, visibility, settings } = parsed.data;

  const id = crypto.randomUUID();
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(0, 8)}`;
  const now = new Date().toISOString();

  try {
    await db.execute({ sql: "ALTER TABLE tournaments ADD COLUMN visibility TEXT DEFAULT 'PUBLIC'", args: [] });
  } catch {}
  try {
    await db.execute({ sql: "ALTER TABLE tournaments ADD COLUMN settings TEXT", args: [] });
  } catch {}

  await db.execute({
    sql: `INSERT INTO tournaments (id, name, slug, type, status, city, platform, prize_pool, entry_fee, creator_fee, max_players, description, start_at, visibility, settings, organizer_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'REGISTRATION', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, slug, type, city ?? null, platform, entryFee, 500, maxPlayers, description ?? null, startAt ?? null, visibility, JSON.stringify(settings), auth.session.userId, now, now],
  });

  return NextResponse.json({ tournament: { id, name, type, status: "REGISTRATION", slug } }, { status: 201 });
}
