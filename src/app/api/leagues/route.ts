import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { League } from '@/lib/db/models/League';
import { User } from '@/lib/db/models/User';
import { getAuthUser } from '@/lib/utils/auth';
import { generateInviteCode } from '@/lib/utils/generate';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB();
    const filter: any = { participants: user._id };
    const leagues = await League.find(filter).populate('adminId', 'username avatar').sort({ createdAt: -1 }).limit(50);
    return successResponse({ leagues });
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB();
    const body = await req.json();
    if (!body.name) return errorResponse('League name required');
    const league = await League.create({
      name: body.name, description: body.description || '', adminId: user._id, inviteCode: generateInviteCode(),
      type: body.type || 'PRIVATE', region: body.region || '', participants: [user._id], currentSeason: 1,
      seasons: [{ seasonNumber: 1, status: 'UPCOMING', standings: [], fixtures: [] }],
      settings: { rounds: body.settings?.rounds || 2, homeAway: body.settings?.homeAway ?? true, maxPlayers: body.settings?.maxPlayers || 20, minPlayers: body.settings?.minPlayers || 2, allowDraws: body.settings?.allowDraws ?? true, autoGenerateFixtures: body.settings?.autoGenerateFixtures ?? true, promotionSpots: body.settings?.promotionSpots || 0, relegationSpots: body.settings?.relegationSpots || 0, matchConfirmationType: body.settings?.matchConfirmationType || 'BOTH' },
    });
    await User.findByIdAndUpdate(user._id, { $push: { leagues: league._id } });
    return successResponse({ league }, 201);
  } catch (error: any) { return errorResponse(error.message, 500); }
}
