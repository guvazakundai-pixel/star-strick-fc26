import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { notifyTournamentStart } from "@/lib/whatsapp";
import { generateKnockoutBracket } from "@/lib/tournament-engine";

export async function POST(req: Request, { params }: { params: Promise<{ tournamentId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { tournamentId } = await params;

  const body = await req.json().catch(() => ({}));
  const assignedTeam = body.assignedTeam || null;

  const tournRes = await db.execute({
    sql: "SELECT id, name, status, type, max_players, entry_fee, organizer_id FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const tourn = tournRes.rows[0] as any;
  if (!tourn) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  if (tourn.status !== "REGISTRATION") {
    return NextResponse.json({ error: "Registration is closed" }, { status: 400 });
  }

  const existingRes = await db.execute({
    sql: "SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
    args: [tournamentId, auth.session.userId],
  });
  if (existingRes.rows.length > 0) {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  const countRes = await db.execute({
    sql: "SELECT count(*) as c FROM tournament_participants WHERE tournament_id = ?",
    args: [tournamentId],
  });
  const currentCount = Number((countRes.rows[0] as Record<string, unknown>)?.c ?? 0);
  if (currentCount >= Number(tourn.max_players)) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
  }

  try {
    await db.execute({ sql: "ALTER TABLE tournament_participants ADD COLUMN assigned_team TEXT", args: [] });
  } catch {}

  const participantId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: "INSERT INTO tournament_participants (id, tournament_id, user_id, seed, status, assigned_team, created_at) VALUES (?, ?, ?, ?, 'REGISTERED', ?, ?)",
    args: [participantId, tournamentId, auth.session.userId, currentCount + 1, assignedTeam, now],
  });

  const newCount = currentCount + 1;

  const organizerRes = await db.execute({
    sql: "SELECT whatsapp FROM users WHERE id = ?",
    args: [tourn.organizer_id],
  });
  const organizerRow = organizerRes.rows[0] as Record<string, unknown> | undefined;
  if (organizerRow?.whatsapp) {
    notifyTournamentStart(organizerRow.whatsapp as string, tourn.name as string, 1, auth.session.username);
  }

  if (newCount >= Number(tourn.max_players)) {
    const allPlayersRes = await db.execute({
      sql: "SELECT tp.user_id, tp.assigned_team, u.whatsapp, u.username FROM tournament_participants tp LEFT JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY tp.seed ASC",
      args: [tournamentId],
    });
    const allPlayers = allPlayersRes.rows.map((r: Record<string, unknown>) => ({
      userId: r.user_id as string,
      assignedTeam: r.assigned_team as string | null,
      whatsapp: r.whatsapp as string | null,
      username: r.username as string,
    }));
    const playerIds = allPlayers.map((p) => p.userId);

    const tournType = String(tourn.type || "KNOCKOUT");

    if (tournType === "KNOCKOUT") {
      const bracketMatches = generateKnockoutBracket(tournamentId, playerIds, true);

      for (const match of bracketMatches) {
        await db.execute({
          sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)",
          args: [crypto.randomUUID(), tournamentId, match.round, match.matchIndex, match.homeUserId, match.awayUserId, now],
        });
      }

      await db.execute({
        sql: "UPDATE tournaments SET status = 'LIVE', bracket = ?, updated_at = ? WHERE id = ?",
        args: [JSON.stringify(bracketMatches), now, tournamentId],
      });
    } else if (tournType === "ROUND_ROBIN") {
      const n = playerIds.length;
      const totalRounds = n % 2 === 0 ? n - 1 : n;
      let matchIndex = 0;
      for (let round = 0; round < totalRounds; round++) {
        for (let i = 0; i < Math.floor(n / 2); i++) {
          const home = round % 2 === 0 ? playerIds[i] : playerIds[n - 1 - i];
          const away = round % 2 === 0 ? playerIds[n - 1 - i] : playerIds[i];
          if (home && away) {
            await db.execute({
              sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)",
              args: [crypto.randomUUID(), tournamentId, round + 1, matchIndex++, home, away, now],
            });
          }
        }
      }

      await db.execute({
        sql: "UPDATE tournaments SET status = 'LIVE', bracket = ?, updated_at = ? WHERE id = ?",
        args: [JSON.stringify({ type: "ROUND_ROBIN", players: playerIds }), now, tournamentId],
      });
    } else if (tournType === "GROUPS") {
      const groupSize = Math.ceil(playerIds.length / Math.ceil(Math.sqrt(playerIds.length)));
      const groups: string[][] = [];
      for (let i = 0; i < playerIds.length; i += groupSize) {
        groups.push(playerIds.slice(i, i + groupSize));
      }

      for (let g = 0; g < groups.length; g++) {
        const groupId = crypto.randomUUID();
        const groupLetter = String.fromCharCode(65 + g);
        await db.execute({
          sql: "INSERT INTO tournament_groups (id, tournament_id, name, seed) VALUES (?, ?, ?, ?)",
          args: [groupId, tournamentId, `Group ${groupLetter}`, g],
        });

        const groupPlayers = groups[g];
        for (const userId of groupPlayers) {
          await db.execute({
            sql: "INSERT INTO tournament_group_standings (id, group_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)",
            args: [crypto.randomUUID(), groupId, userId],
          });
        }

        for (let i = 0; i < groupPlayers.length; i++) {
          for (let j = i + 1; j < groupPlayers.length; j++) {
            await db.execute({
              sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, status, group_id, created_at) VALUES (?, ?, 1, ?, ?, ?, 'PENDING', ?, ?)",
              args: [crypto.randomUUID(), tournamentId, matchIndex++, groupPlayers[i], groupPlayers[j], groupId, now],
            });
          }
        }
      }

      await db.execute({
        sql: "UPDATE tournaments SET status = 'LIVE', bracket = ?, updated_at = ? WHERE id = ?",
        args: [JSON.stringify({ type: "GROUPS", groups: groups.length }), now, tournamentId],
      });
    } else {
      const bracketMatches = generateKnockoutBracket(tournamentId, playerIds, true);

      for (const match of bracketMatches) {
        await db.execute({
          sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)",
          args: [crypto.randomUUID(), tournamentId, match.round, match.matchIndex, match.homeUserId, match.awayUserId, now],
        });
      }

      await db.execute({
        sql: "UPDATE tournaments SET status = 'LIVE', bracket = ?, updated_at = ? WHERE id = ?",
        args: [JSON.stringify(bracketMatches), now, tournamentId],
      });
    }

    await db.execute({
      sql: "UPDATE tournament_participants SET status = 'ACTIVE' WHERE tournament_id = ?",
      args: [tournamentId],
    });
  }

  return NextResponse.json({ participant: { id: participantId, status: "REGISTERED" } }, { status: 201 });
}
