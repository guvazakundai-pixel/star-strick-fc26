import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const { action, data } = await req.json();

  const league = await prisma.league.findUnique({ where: { id }, select: { id: true, adminId: true, status: true } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (league.adminId !== auth.session.userId && auth.session.role !== "ADMIN" && auth.session.role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    switch (action) {
      case "update-settings":
        await prisma.league.update({ where: { id }, data });
        return NextResponse.json({ success: true });

      case "pause":
        if (league.status !== "LIVE") return NextResponse.json({ error: "League not live" }, { status: 400 });
        await prisma.league.update({ where: { id }, data: { status: "PAUSED" } });
        return NextResponse.json({ success: true });

      case "resume":
        await prisma.league.update({ where: { id }, data: { status: "LIVE" } });
        return NextResponse.json({ success: true });

      case "end-season":
        await prisma.league.update({ where: { id }, data: { status: "COMPLETED" } });
        return NextResponse.json({ success: true });

      case "start-season": {
        const seasons = await prisma.leagueSeason.findMany({ where: { leagueId: id }, orderBy: { seasonNumber: "desc" }, take: 1 });
        const nextNum = (seasons[0]?.seasonNumber ?? 0) + 1;
        await prisma.leagueSeason.create({ data: { leagueId: id, seasonNumber: nextNum, status: "ACTIVE" } });
        await prisma.league.update({ where: { id }, data: { status: "REGISTRATION" } });
        return NextResponse.json({ success: true, seasonNumber: nextNum });
      }

      case "kick-player":
        await prisma.leagueParticipant.deleteMany({ where: { leagueId: id, userId: data.userId } });
        await prisma.leagueStanding.deleteMany({ where: { leagueId: id, userId: data.userId } });
        return NextResponse.json({ success: true });

      case "force-result": {
        const fixtureData: any = { status: "COMPLETED", homeScore: data.homeScore, awayScore: data.awayScore, completedAt: new Date() };
        if (data.winnerId) fixtureData.winnerId = data.winnerId;
        await prisma.leagueFixture.update({ where: { id: data.fixtureId }, data: fixtureData });
        if (data.homeScore !== undefined && data.awayScore !== undefined && data.homeUserId && data.awayUserId) {
          const season = await prisma.leagueSeason.findFirst({ where: { leagueId: id, status: "ACTIVE" } });
          if (season) {
            await db.execute({
              sql: `INSERT OR REPLACE INTO league_standings (league_id, season_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference)
              VALUES (?,(SELECT id FROM league_seasons WHERE league_id=? AND status='ACTIVE'),?,
                COALESCE((SELECT points FROM league_standings WHERE league_id=? AND user_id=?),0) + CASE WHEN ? > ? THEN 3 WHEN ? = ? THEN 1 ELSE 0 END,
                COALESCE((SELECT played FROM league_standings WHERE league_id=? AND user_id=?),0) + 1,
                COALESCE((SELECT wins FROM league_standings WHERE league_id=? AND user_id=?),0) + CASE WHEN ? > ? THEN 1 ELSE 0 END,
                COALESCE((SELECT draws FROM league_standings WHERE league_id=? AND user_id=?),0) + CASE WHEN ? = ? THEN 1 ELSE 0 END,
                COALESCE((SELECT losses FROM league_standings WHERE league_id=? AND user_id=?),0) + CASE WHEN ? < ? THEN 1 ELSE 0 END,
                COALESCE((SELECT goals_for FROM league_standings WHERE league_id=? AND user_id=?),0) + ?,
                COALESCE((SELECT goals_against FROM league_standings WHERE league_id=? AND user_id=?),0) + ?,
                COALESCE((SELECT goal_difference FROM league_standings WHERE league_id=? AND user_id=?),0) + ? - ?)`,
              args: [id, id, data.homeUserId, id, data.homeUserId, data.homeScore, data.awayScore, data.homeScore, data.awayScore, id, data.homeUserId, id, data.homeUserId, data.homeScore, data.awayScore, id, data.homeUserId, data.homeScore, data.awayScore, id, data.homeUserId, data.homeScore, data.awayScore, id, data.homeUserId, data.homeScore, id, data.homeUserId, data.awayScore, id, data.homeUserId, data.homeScore, data.awayScore],
            });
            await db.execute({
              sql: `INSERT OR REPLACE INTO league_standings (league_id, season_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference)
              VALUES (?,(SELECT id FROM league_seasons WHERE league_id=? AND status='ACTIVE'),?,
                COALESCE((SELECT points FROM league_standings WHERE league_id=? AND user_id=?),0) + CASE WHEN ? > ? THEN 0 WHEN ? = ? THEN 1 ELSE 3 END,
                COALESCE((SELECT played FROM league_standings WHERE league_id=? AND user_id=?),0) + 1,
                COALESCE((SELECT wins FROM league_standings WHERE league_id=? AND user_id=?),0) + CASE WHEN ? < ? THEN 1 ELSE 0 END,
                COALESCE((SELECT draws FROM league_standings WHERE league_id=? AND user_id=?),0) + CASE WHEN ? = ? THEN 1 ELSE 0 END,
                COALESCE((SELECT losses FROM league_standings WHERE league_id=? AND user_id=?),0) + CASE WHEN ? > ? THEN 1 ELSE 0 END,
                COALESCE((SELECT goals_for FROM league_standings WHERE league_id=? AND user_id=?),0) + ?,
                COALESCE((SELECT goals_against FROM league_standings WHERE league_id=? AND user_id=?),0) + ?,
                COALESCE((SELECT goal_difference FROM league_standings WHERE league_id=? AND user_id=?),0) + ? - ?)`,
              args: [id, id, data.awayUserId, id, data.awayUserId, data.homeScore, data.awayScore, data.homeScore, data.awayScore, id, data.awayUserId, id, data.awayUserId, data.homeScore, data.awayScore, id, data.awayUserId, data.homeScore, data.awayScore, id, data.awayUserId, data.homeScore, data.awayScore, id, data.awayUserId, data.awayScore, id, data.awayUserId, data.homeScore, id, data.awayUserId, data.awayScore, data.homeScore],
            });
          }
        }
        return NextResponse.json({ success: true });
      }

      case "void-match":
        await prisma.leagueFixture.update({ where: { id: data.fixtureId }, data: { status: "VOIDED", homeScore: null, awayScore: null } });
        return NextResponse.json({ success: true });

      case "adjust-points": {
        const entry = await prisma.leagueStanding.findUnique({
          where: { leagueId_userId: { leagueId: id, userId: data.userId } },
        });
        if (!entry) return NextResponse.json({ error: "Player not in standings" }, { status: 404 });
        const adjustment = data.amount || 0;
        await prisma.leagueStanding.update({
          where: { leagueId_userId: { leagueId: id, userId: data.userId } },
          data: { points: entry.points + adjustment },
        });
        return NextResponse.json({ success: true, newPoints: entry.points + adjustment });
      }

      case "promote-moderator":
        await prisma.league.update({ where: { id }, data: { adminId: data.userId } });
        return NextResponse.json({ success: true });

      case "regenerate-fixtures": {
        await prisma.leagueFixture.deleteMany({ where: { leagueId: id, status: "PENDING" } });
        return NextResponse.json({ success: true, message: "Clear pending fixtures. Run generate-fixtures again." });
      }

      case "freeze-standings":
        await prisma.league.update({ where: { id }, data: { status: "FROZEN" } });
        return NextResponse.json({ success: true });

      case "unfreeze-standings":
        await prisma.league.update({ where: { id }, data: { status: "LIVE" } });
        return NextResponse.json({ success: true });

      case "set-deadline": {
        await prisma.league.update({ where: { id }, data: { matchDeadline: new Date(data.deadline) } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
