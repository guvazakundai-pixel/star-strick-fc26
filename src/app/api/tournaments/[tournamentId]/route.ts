import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

const PatchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(["KNOCKOUT", "ROUND_ROBIN", "GROUPS"]).optional(),
  status: z.enum(["DRAFT", "REGISTRATION", "LIVE", "COMPLETED"]).optional(),
  city: z.string().max(80).optional(),
  prizePool: z.coerce.number().int().min(0).optional(),
  maxPlayers: z.coerce.number().int().min(2).max(256).optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "INVITE_ONLY"]).optional(),
  settings: z.record(z.unknown()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;

  const tournRes = await db.execute({
    sql: `SELECT t.*, u.username as organizer_username, u.display_name as organizer_display_name, u.avatar_url as organizer_avatar_url
          FROM tournaments t
          LEFT JOIN users u ON u.id = t.organizer_id
          WHERE t.id = ?`,
    args: [tournamentId],
  });

  const r = tournRes.rows[0] as any;
  if (!r) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participantsRes = await db.execute({
    sql: `SELECT tp.id, tp.user_id, tp.seed, tp.status, tp.final_position, tp.assigned_team,
                 u.username, u.display_name, u.avatar_url
          FROM tournament_participants tp
          LEFT JOIN users u ON u.id = tp.user_id
          WHERE tp.tournament_id = ?
          ORDER BY tp.seed ASC`,
    args: [r.id],
  });

  const matchesRes = await db.execute({
    sql: `SELECT tm.*,
                 p1.username as p1_username, p1.display_name as p1_display_name, p1.avatar_url as p1_avatar_url,
                 p2.username as p2_username, p2.display_name as p2_display_name, p2.avatar_url as p2_avatar_url,
                 w.username as w_username, w.display_name as w_display_name
          FROM tournament_matches tm
          LEFT JOIN users p1 ON p1.id = tm.player1_id
          LEFT JOIN users p2 ON p2.id = tm.player2_id
          LEFT JOIN users w ON w.id = tm.winner_id
          WHERE tm.tournament_id = ?
          ORDER BY tm.round ASC, tm.match_index ASC`,
    args: [r.id],
  });

  const groupsRes = await db.execute({
    sql: `SELECT tg.* FROM tournament_groups tg WHERE tg.tournament_id = ? ORDER BY tg.seed ASC`,
    args: [r.id],
  });

  const groupIds = groupsRes.rows.map((g: any) => g.id);

  let groupStandings: Record<string, any[]> = {};
  if (groupIds.length > 0) {
    const placeholders = groupIds.map(() => "?").join(",");
    const gsRes = await db.execute({
      sql: `SELECT tgs.*, u.username, u.display_name, u.avatar_url
            FROM tournament_group_standings tgs
            LEFT JOIN users u ON u.id = tgs.user_id
            WHERE tgs.group_id IN (${placeholders})
            ORDER BY tgs.group_id, tgs.points DESC`,
      args: groupIds,
    });
    for (const gs of gsRes.rows as any[]) {
      if (!groupStandings[gs.group_id]) groupStandings[gs.group_id] = [];
      groupStandings[gs.group_id].push(gs);
    }
  }

  const tournament = {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    type: r.type,
    status: r.status,
    city: r.city ?? null,
    prizePool: Number(r.prize_pool ?? 0),
    entryFee: Number(r.entry_fee ?? 0),
    creatorFee: Number(r.creator_fee ?? 0),
    platform: r.platform ?? null,
    maxPlayers: Number(r.max_players ?? 32),
    visibility: r.visibility ?? "PUBLIC",
    settings: r.settings ? JSON.parse(String(r.settings)) : null,
    bracket: r.bracket ? JSON.parse(String(r.bracket)) : null,
    startAt: r.start_at ?? null,
    endAt: r.end_at ?? null,
    createdAt: r.created_at,
    organizer: {
      id: r.organizer_id,
      username: r.organizer_username,
      displayName: r.organizer_display_name ?? null,
      avatarUrl: r.organizer_avatar_url ?? null,
    },
    participants: participantsRes.rows.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      username: p.username,
      displayName: p.display_name ?? null,
      avatarUrl: p.avatar_url ?? null,
      seed: Number(p.seed),
      status: p.status,
      finalPosition: p.final_position ?? null,
      assignedTeam: p.assigned_team ?? null,
    })),
    matches: matchesRes.rows.map((m: any) => ({
      id: m.id,
      round: Number(m.round),
      matchIndex: Number(m.match_index),
      player1: m.player1_id ? { id: m.player1_id, username: m.p1_username, displayName: m.p1_display_name ?? null, avatarUrl: m.p1_avatar_url ?? null } : null,
      player2: m.player2_id ? { id: m.player2_id, username: m.p2_username, displayName: m.p2_display_name ?? null, avatarUrl: m.p2_avatar_url ?? null } : null,
      winner: m.winner_id ? { id: m.winner_id, username: m.w_username, displayName: m.w_display_name ?? null } : null,
      score1: m.score1 != null ? Number(m.score1) : null,
      score2: m.score2 != null ? Number(m.score2) : null,
      status: m.status,
      groupId: m.group_id ?? null,
      bracket: m.bracket ?? null,
      scheduledAt: m.scheduled_at ?? null,
      completedAt: m.completed_at ?? null,
    })),
    groups: groupsRes.rows.map((g: any) => ({
      id: g.id,
      tournamentId: g.tournament_id,
      name: g.name,
      seed: Number(g.seed),
      standings: (groupStandings[g.id] || []).map((gs: any) => ({
        id: gs.id,
        userId: gs.user_id,
        username: gs.username,
        displayName: gs.display_name ?? null,
        points: Number(gs.points),
        played: Number(gs.played),
        wins: Number(gs.wins),
        draws: Number(gs.draws),
        losses: Number(gs.losses),
        goalsFor: Number(gs.goals_for),
        goalsAgainst: Number(gs.goals_against),
        goalDifference: Number(gs.goal_difference),
      })),
    })),
  };

  return NextResponse.json({ tournament });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const tRes = await db.execute({
    sql: "SELECT organizer_id FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const tRow = tRes.rows[0] as any;
  if (!tRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOrganizer = tRow.organizer_id === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOrganizer && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const fields = parsed.data;
  const setClauses: string[] = [];
  const args: any[] = [];

  if (fields.name !== undefined) { setClauses.push("name = ?"); args.push(fields.name); }
  if (fields.description !== undefined) { setClauses.push("description = ?"); args.push(fields.description); }
  if (fields.type !== undefined) { setClauses.push("type = ?"); args.push(fields.type); }
  if (fields.status !== undefined) { setClauses.push("status = ?"); args.push(fields.status); }
  if (fields.city !== undefined) { setClauses.push("city = ?"); args.push(fields.city); }
  if (fields.prizePool !== undefined) { setClauses.push("prize_pool = ?"); args.push(fields.prizePool); }
  if (fields.maxPlayers !== undefined) { setClauses.push("max_players = ?"); args.push(fields.maxPlayers); }
  if (fields.visibility !== undefined) { setClauses.push("visibility = ?"); args.push(fields.visibility); }
  if (fields.settings !== undefined) { setClauses.push("settings = ?"); args.push(JSON.stringify(fields.settings)); }
  if (fields.startAt !== undefined) { setClauses.push("start_at = ?"); args.push(fields.startAt); }
  if (fields.endAt !== undefined) { setClauses.push("end_at = ?"); args.push(fields.endAt); }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  setClauses.push("updated_at = ?");
  args.push(new Date().toISOString());
  args.push(tournamentId);

  await db.execute({
    sql: `UPDATE tournaments SET ${setClauses.join(", ")} WHERE id = ?`,
    args,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const dRes = await db.execute({
    sql: "SELECT organizer_id FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const dRow = dRes.rows[0] as any;
  if (!dRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOrganizer = dRow.organizer_id === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOrganizer && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.execute({
    sql: "DELETE FROM tournament_matches WHERE tournament_id = ?",
    args: [tournamentId],
  });
  await db.execute({
    sql: "DELETE FROM tournament_group_standings WHERE group_id IN (SELECT id FROM tournament_groups WHERE tournament_id = ?)",
    args: [tournamentId],
  });
  await db.execute({
    sql: "DELETE FROM tournament_groups WHERE tournament_id = ?",
    args: [tournamentId],
  });
  await db.execute({
    sql: "DELETE FROM tournament_participants WHERE tournament_id = ?",
    args: [tournamentId],
  });
  await db.execute({
    sql: "DELETE FROM tournament_invite_codes WHERE tournament_id = ?",
    args: [tournamentId],
  });
  await db.execute({
    sql: "DELETE FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });

  return NextResponse.json({ success: true });
}
