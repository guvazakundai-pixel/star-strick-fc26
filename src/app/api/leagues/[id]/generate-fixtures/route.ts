import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { League } from '@/lib/db/models/League';
import { Match } from '@/lib/db/models/Match';
import { getAuthUser } from '@/lib/utils/auth';
import { generateRoundRobinFixtures } from '@/lib/utils/league-engine';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params;
    const league = await League.findById(id);
    if (!league) return notFoundResponse();
    if (league.adminId.toString() !== user._id.toString()) return unauthorizedResponse('Only admin');
    const season = league.seasons.find((s: any) => s.seasonNumber === league.currentSeason);
    if (!season) return notFoundResponse('No active season');
    const playerIds = league.participants.map((p: any) => p.toString());
    if (playerIds.length < 2) return errorResponse('Need 2+ players');
    const fixtures = generateRoundRobinFixtures(playerIds, league.settings.rounds, league.settings.homeAway);
    const matches = await Promise.all(fixtures.map((f) => Match.create({ leagueId: league._id, homePlayerId: f.homePlayerId, awayPlayerId: f.awayPlayerId, matchday: f.matchday, status: 'SCHEDULED', confirmation: { home: 'PENDING', away: 'PENDING' } })));
    season.fixtures = matches.map((m) => m._id); season.status = 'ACTIVE'; season.startedAt = new Date();
    league.markModified('seasons'); await league.save();
    return successResponse({ fixtures: matches }, 201);
  } catch (error: any) { return errorResponse(error.message, 500); }
}
