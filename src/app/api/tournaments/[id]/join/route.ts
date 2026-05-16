import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Tournament } from '@/lib/db/models/Tournament';
import { User } from '@/lib/db/models/User';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params;
    const tournament = await Tournament.findById(id);
    if (!tournament) return notFoundResponse();
    if (tournament.status !== 'REGISTRATION' && tournament.status !== 'UPCOMING') return errorResponse('Registration closed');
    if (tournament.currentPlayers >= tournament.maxPlayers) return errorResponse('Tournament full');
    if (tournament.participants.some((p: any) => p.toString() === user._id.toString())) return errorResponse('Already registered');
    tournament.participants.push(user._id); tournament.currentPlayers = tournament.participants.length;
    await tournament.save(); await User.findByIdAndUpdate(user._id, { $addToSet: { tournaments: tournament._id } });
    return successResponse({ tournament });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
