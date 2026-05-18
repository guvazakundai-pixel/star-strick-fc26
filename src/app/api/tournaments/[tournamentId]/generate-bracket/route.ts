import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { generateKnockoutBracket, generateGroupStage, generateGroupFixtures } from "@/lib/tournament-engine";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const tournRes = await db.execute({
    sql: `SELECT id, name, type, status, organizer_id, bracket FROM tournaments WHERE id = ?`,
    args: [tournamentId],
  });
  const tournRow = tournRes.rows[0] as any;
  if (!tournRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOrganizer = tournRow.organizer_id === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOrganizer && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (tournRow.bracket) {
    return NextResponse.json({ error: "Bracket already generated" }, { status: 400 });
  }

  const participantsRes = await db.execute({
    sql: "SELECT user_id, assigned_team FROM tournament_participants WHERE tournament_id = ? AND status IN ('REGISTERED', 'ACTIVE') ORDER BY seed ASC",
    args: [tournamentId],
  });

  const participantIds = participantsRes.rows.map((r: Record<string, unknown>) => r.user_id as string);

  if (participantIds.length < 2) {
    return NextResponse.json({ error: "Need at least 2 participants" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const type = tournRow.type as string;

  try {
    switch (type) {
      case "KNOCKOUT": {
        const matches = generateKnockoutBracket(tournamentId, participantIds, true);
        for (const m of matches) {
          await db.execute({
            sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)",
            args: [crypto.randomUUID(), tournamentId, m.round, m.matchIndex, m.homeUserId, m.awayUserId, now],
          });
        }
        await db.execute({
          sql: "UPDATE tournaments SET bracket = ?, status = 'LIVE', updated_at = ? WHERE id = ?",
          args: [JSON.stringify(matches), now, tournamentId],
        });
        break;
      }

      case "ROUND_ROBIN": {
        const n = participantIds.length;
        const players = [...participantIds];
        const odd = players.length % 2 !== 0;
        if (odd) players.push("");
        const totalRounds = players.length - 1;
        const fixed = players[0];
        const rotatable = players.slice(1);
        let matchIndex = 0;

        for (let round = 1; round <= totalRounds; round++) {
          const roundPlayers = [fixed, ...rotatable];
          const mpRound = Math.floor(players.length / 2);
          for (let m = 0; m < mpRound; m++) {
            const p1 = roundPlayers[m];
            const p2 = roundPlayers[players.length - 1 - m];
            if (!p1 || !p2) continue;
            await db.execute({
              sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'READY', ?)",
              args: [crypto.randomUUID(), tournamentId, round, matchIndex++, p1, p2, now],
            });
          }
          const last = rotatable.pop()!;
          rotatable.unshift(last);
        }

        await db.execute({
          sql: "UPDATE tournaments SET status = 'LIVE', updated_at = ? WHERE id = ?",
          args: [now, tournamentId],
        });
        break;
      }

      case "GROUPS": {
        const groupSize = 4;
        const groups = generateGroupStage(participantIds, groupSize);
        let globalMatchIndex = 0;

        for (const g of groups) {
          const groupId = crypto.randomUUID();
          await db.execute({
            sql: "INSERT INTO tournament_groups (id, tournament_id, name, seed) VALUES (?, ?, ?, ?)",
            args: [groupId, tournamentId, g.name, groups.indexOf(g)],
          });

          for (const uid of g.userIds) {
            await db.execute({
              sql: "INSERT INTO tournament_group_standings (id, group_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)",
              args: [crypto.randomUUID(), groupId, uid],
            });
          }

          const groupFixtures = generateGroupFixtures(tournamentId, groupId, g.userIds);
          for (const gf of groupFixtures) {
            await db.execute({
              sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, group_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'READY', ?)",
              args: [crypto.randomUUID(), tournamentId, gf.round, globalMatchIndex++, gf.homeUserId, gf.awayUserId, groupId, now],
            });
          }
        }

        await db.execute({
          sql: "UPDATE tournaments SET status = 'LIVE', updated_at = ? WHERE id = ?",
          args: [now, tournamentId],
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported type: ${type}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await db.execute({
    sql: "UPDATE tournament_participants SET status = 'ACTIVE' WHERE tournament_id = ? AND status = 'REGISTERED'",
    args: [tournamentId],
  });

  return NextResponse.json({ success: true });
}
