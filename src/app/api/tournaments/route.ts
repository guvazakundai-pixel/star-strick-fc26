import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Tournament } from '@/lib/db/models/Tournament';
import { User } from '@/lib/db/models/User';
import { getAuthUser } from '@/lib/utils/auth';
import { generateInviteCode } from '@/lib/utils/generate';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const filter: any = { participants: user._id };
    const tournaments = await Tournament.find(filter).populate('adminId', 'username avatar').sort({ createdAt: -1 }).limit(50);
    return successResponse({ tournaments });
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const body = await req.json();
    if (!body.name || !body.format || !body.maxPlayers) return errorResponse('Name, format, maxPlayers required');
    const tournament = await Tournament.create({
      name: body.name, description: body.description || '', adminId: user._id, inviteCode: generateInviteCode(),
      type: body.type || 'PUBLIC', format: body.format, maxPlayers: body.maxPlayers, participantMode: body.participantMode || '1V1',
      currentPlayers: 1, status: 'REGISTRATION', participants: [user._id],
      rules: { groupStage: body.rules?.groupStage || false, groupSize: body.rules?.groupSize || 4, qualificationPerGroup: body.rules?.qualificationPerGroup || 2, homeAway: body.rules?.homeAway || false, bestOf: body.rules?.bestOf || 1, matchDuration: body.rules?.matchDuration || 90 },
      groups: [], bracket: [], matches: [],
    });
    await User.findByIdAndUpdate(user._id, { $push: { tournaments: tournament._id } });
    return successResponse({ tournament }, 201);
  } catch (error: any) { return errorResponse(error.message, 500); }
}
