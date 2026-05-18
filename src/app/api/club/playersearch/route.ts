import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

type Row = Record<string, unknown>;
async function q(sql: string, args: unknown[] = []) { const r = await db.execute({ sql, args }); return r.rows as Row[]; }

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { query, filters } = await req.json();

  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (query) { conditions.push("(u.username LIKE ? OR u.display_name LIKE ?)"); params.push(`%${query}%`, `%${query}%`); }
  if (filters?.minWinRate) { conditions.push("(ps.wins * 1.0 / NULLIF(ps.wins + ps.losses, 0)) >= ?"); params.push(filters.minWinRate); }
  if (filters?.minRating) { conditions.push("ps.skill_rating >= ?"); params.push(filters.minRating); }
  if (filters?.country) { conditions.push("u.country = ?"); params.push(filters.country); }
  if (filters?.platform) { conditions.push("u.platform = ?"); params.push(filters.platform); }
  if (filters?.role) { conditions.push("ps.preferred_role = ?"); params.push(filters.role); }

  const players = await q(
    `SELECT u.id, u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl,
      u.country, u.platform, ps.wins, ps.losses, ps.skill_rating AS skillRating
     FROM users u LEFT JOIN player_stats ps ON ps.user_id = u.id
     WHERE ${conditions.join(" AND ")}
       AND u.id NOT IN (SELECT user_id FROM club_members WHERE status='ACTIVE')
     ORDER BY ps.skill_rating DESC LIMIT 50`,
    params
  );

  return NextResponse.json({ players });
}
