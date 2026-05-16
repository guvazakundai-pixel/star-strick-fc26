import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Match } from '@/lib/db/models/Match';
import { League } from '@/lib/db/models/League';
import { getAuthUser } from '@/lib/utils/auth';
import { calculateLeagueStandings, sortStandings } from '@/lib/utils/league-engine';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params;
    const match = await Match.findById(id).populate('homePlayerId', 'username avatar').populate('awayPlayerId', 'username avatar');
    if (!match) return notFoundResponse(); return successResponse({ match });
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params; const body = await req.json();
    const match = await Match.findById(id);
    if (!match) return notFoundResponse();
    const isHome = match.homePlayerId.toString() === user._id.toString();
    const isAway = match.awayPlayerId.toString() === user._id.toString();
    if (!isHome && !isAway) return unauthorizedResponse('Not your match');
    if (match.status === 'COMPLETED') return errorResponse('Already completed');

    if (body.homeScore !== undefined && body.awayScore !== undefined) {
      match.homeScore = body.homeScore; match.awayScore = body.awayScore;
      if (isHome) match.confirmation.home = 'CONFIRMED';
      if (isAway) match.confirmation.away = 'CONFIRMED';
      match.status = 'IN_PROGRESS';
    }
    if (body.screenshotUrl) match.screenshotUrl = body.screenshotUrl;

    if (match.confirmation.home === 'CONFIRMED' && match.confirmation.away === 'CONFIRMED') {
      match.status = 'COMPLETED';
      match.winnerId = match.homeScore! > match.awayScore! ? match.homePlayerId : match.homeScore! < match.awayScore! ? match.awayPlayerId : undefined;
      match.playedDate = new Date();
      if (match.leagueId) {
        const league = await League.findById(match.leagueId);
        if (league) {
          const season = league.seasons.find((s: any) => s.seasonNumber === league.currentSeason);
          if (season) {
            season.standings = calculateLeagueStandings(season.standings as any, match.homePlayerId.toString(), match.awayPlayerId.toString(), match.homeScore!, match.awayScore!) as any;
            season.standings = sortStandings(season.standings as any) as any;
            league.markModified('seasons'); await league.save();
          }
        }
      }
    }
    await match.save(); return successResponse({ match });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
