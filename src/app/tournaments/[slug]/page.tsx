import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { TournamentDetailClient } from "@/components/tournaments/TournamentDetailClient";

function typeLabel(type: string) {
  switch (type) {
    case "KNOCKOUT": return "Knockout";
    case "ROUND_ROBIN": return "Round Robin";
    case "GROUPS": return "Group + Knockout";
    default: return type;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "LIVE": return "Live";
    case "REGISTRATION": return "Registration Open";
    case "COMPLETED": return "Completed";
    case "DRAFT": return "Draft";
    default: return status;
  }
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tournRes = await db.execute({
    sql: `SELECT t.*, u.username as organizer_username, u.display_name as organizer_display_name, u.avatar_url as organizer_avatar_url
          FROM tournaments t
          LEFT JOIN users u ON u.id = t.organizer_id
          WHERE t.slug = ? OR t.id = ?
          LIMIT 1`,
    args: [slug, slug],
  });

  const r = tournRes.rows[0] as any;
  if (!r) notFound();

  const participantsRes = await db.execute({
    sql: `SELECT tp.id, tp.user_id, tp.seed, tp.status, tp.final_position, tp.assigned_team,
                 u.username, u.display_name, u.avatar_url
          FROM tournament_participants tp
          LEFT JOIN users u ON u.id = tp.user_id
          WHERE tp.tournament_id = ? AND tp.status IN ('REGISTERED', 'ACTIVE')
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

  let groupStandingsMap: Record<string, any[]> = {};
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
      if (!groupStandingsMap[gs.group_id]) groupStandingsMap[gs.group_id] = [];
      groupStandingsMap[gs.group_id].push(gs);
    }
  }

  const tournament = {
    id: r.id,
    name: r.name,
    slug: r.slug,
    type: String(r.type),
    status: String(r.status),
    city: r.city ?? null,
    prizePool: Number(r.prize_pool ?? 0),
    entryFee: Number(r.entry_fee ?? 0),
    maxPlayers: Number(r.max_players ?? 32),
    description: r.description ?? null,
    platform: r.platform ?? null,
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
      name: g.name,
      seed: Number(g.seed),
      standings: (groupStandingsMap[g.id] || []).map((gs: any) => ({
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

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <TournamentDetailClient
          tournament={tournament}
          participants={tournament.participants}
          matches={tournament.matches}
          groups={tournament.groups}
          typeLabel={typeLabel(tournament.type)}
          statusLabel={statusLabel(tournament.status)}
        />
      </div>
    </div>
  );
}
