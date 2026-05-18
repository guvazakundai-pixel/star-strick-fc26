import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await db.execute({
      sql: `SELECT t.id, t.name, t.slug, t.type, t.status, t.city, t.prize_pool, t.entry_fee, t.max_players, t.start_at, t.created_at, t.visibility,
            u.username as organizer_name,
            (SELECT count(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id AND tp.status IN ('REGISTERED', 'ACTIVE')) as player_count
            FROM tournaments t
            LEFT JOIN users u ON u.id = t.organizer_id
            WHERE t.status IN ('REGISTRATION', 'LIVE')
            ORDER BY t.created_at DESC
            LIMIT 20`,
      args: [],
    });

    const tournaments = res.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      status: row.status,
      city: row.city ?? null,
      prizePool: Number(row.prize_pool ?? 0),
      entryFee: Number(row.entry_fee ?? 0),
      maxPlayers: Number(row.max_players ?? 16),
      playerCount: Number(row.player_count ?? 0),
      startAt: row.start_at ?? null,
      createdAt: row.created_at,
      visibility: row.visibility ?? "PUBLIC",
      organizerName: row.organizer_name ?? "unknown",
    }));

    return NextResponse.json({ success: true, data: tournaments });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
