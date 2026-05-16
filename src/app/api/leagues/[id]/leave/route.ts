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
    if (league.adminId.toString() === user._id.toString()) return errorResponse('Admin cannot leave');
    league.participants = league.participants.filter((p: any) => p.toString() !== user._id.toString()) as any;
    const season = league.seasons.find((s: any) => s.seasonNumber === league.currentSeason);
    if (season) season.standings = season.standings.filter((s: any) => s.playerId.toString() !== user._id.toString());
    await league.save(); await User.findByIdAndUpdate(user._id, { $pull: { leagues: league._id } });
    return successResponse({ message: 'Left league' });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
