import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await db.execute({
    sql: `SELECT t.*, u.id as o_id, u.username as o_username, u.display_name as o_display_name
          FROM tournaments t
          LEFT JOIN users u ON u.id = t.organizer_id
          WHERE t.id = ?`,
    args: [id],
  });
  const row = res.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const participantsRes = await db.execute({
    sql: `SELECT tp.id, tp.user_id, tp.seed, tp.status, tp.final_position, u.username, u.display_name
          FROM tournament_participants tp
          LEFT JOIN users u ON u.id = tp.user_id
          WHERE tp.tournament_id = ?
          ORDER BY tp.seed ASC, tp.created_at ASC`,
    args: [id],
  });
  const participants = participantsRes.rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    userId: r.user_id,
    username: r.username ?? "unknown",
    displayName: r.display_name ?? null,
    seed: Number(r.seed ?? 0),
    status: r.status ?? "REGISTERED",
  }));

  let bracket = null;
  if (row.bracket) {
    try {
      bracket = typeof row.bracket === "string" ? JSON.parse(row.bracket as string) : row.bracket;
    } catch {}
  }

  return NextResponse.json({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    city: row.city ?? null,
    platform: row.platform ?? null,
    prizePool: Number(row.prize_pool ?? 0),
    entryFee: Number(row.entry_fee ?? 0),
    creatorFee: Number(row.creator_fee ?? 0),
    maxPlayers: Number(row.max_players ?? 16),
    description: row.description ?? null,
    startAt: row.start_at ?? null,
    createdAt: row.created_at,
    organizer: { id: row.o_id, username: row.o_username, displayName: row.o_display_name ?? null },
    participants,
    bracket,
  });
}
