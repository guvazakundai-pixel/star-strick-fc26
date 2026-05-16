import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { League } from '@/lib/db/models/League';
import { User } from '@/lib/db/models/User';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params;
    const league = await League.findById(id);
    if (!league) return notFoundResponse();
    if (league.bannedPlayers.includes(user._id)) return errorResponse('Banned');
    if (league.participants.length >= league.settings.maxPlayers) return errorResponse('League full');
    if (league.participants.some((p: any) => p.toString() === user._id.toString())) return errorResponse('Already member');
    league.participants.push(user._id);
    const season = league.seasons.find((s: any) => s.seasonNumber === league.currentSeason);
    if (season) season.standings.push({ playerId: user._id, points: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, form: [], cleanSheets: 0 });
    await league.save(); await User.findByIdAndUpdate(user._id, { $addToSet: { leagues: league._id } });
    return successResponse({ league });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
