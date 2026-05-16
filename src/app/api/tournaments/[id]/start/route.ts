import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Tournament } from '@/lib/db/models/Tournament';
import { Match } from '@/lib/db/models/Match';
import { getAuthUser } from '@/lib/utils/auth';
import { generateKnockoutBracket, generateGroupStage } from '@/lib/utils/tournament-engine';
import { generateRoundRobinFixtures } from '@/lib/utils/league-engine';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params;
    const tournament = await Tournament.findById(id);
    if (!tournament) return notFoundResponse();
    if (tournament.adminId.toString() !== user._id.toString()) return unauthorizedResponse('Only admin');
    if (tournament.status !== 'REGISTRATION') return errorResponse('Already started');
    const playerIds = tournament.participants.map((p: any) => p.toString());

    if (tournament.format === 'GROUP_STAGE' || tournament.format === 'HYBRID') {
      const groups = generateGroupStage(playerIds, tournament.rules.groupSize);
      tournament.groups = groups.map((g) => ({ name: g.name, standings: g.players.map((p) => ({ playerId: p, points: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, form: [] })) }));
      const allMatches: any[] = [];
      for (const group of tournament.groups) {
        const ids = group.standings.map((s: any) => s.playerId.toString());
        const fixtures = generateRoundRobinFixtures(ids, 1, false);
        const matches = await Promise.all(fixtures.map((f) => Match.create({ tournamentId: tournament._id, groupName: group.name, homePlayerId: f.homePlayerId, awayPlayerId: f.awayPlayerId, matchday: f.matchday, status: 'SCHEDULED', confirmation: { home: 'PENDING', away: 'PENDING' } })));
        allMatches.push(...matches);
      }
      tournament.matches = allMatches.map((m) => m._id);
    }

    if (tournament.format === 'KNOCKOUT' || tournament.format === 'HYBRID') {
      tournament.bracket = generateKnockoutBracket(playerIds);
    }

    tournament.status = 'IN_PROGRESS'; tournament.startDate = new Date();
    await tournament.save();
    return successResponse({ tournament });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
