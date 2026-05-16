import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Invite } from '@/lib/db/models/Invite';
import { League } from '@/lib/db/models/League';
import { Tournament } from '@/lib/db/models/Tournament';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { code } = await params;
    const invite = await Invite.findOne({ code: code.toUpperCase(), isActive: true });
    if (!invite) return notFoundResponse('Invalid code');
    if (invite.expiresAt && invite.expiresAt < new Date()) return errorResponse('Expired');
    if (invite.maxUses > 0 && invite.currentUses >= invite.maxUses) return errorResponse('Max uses reached');
    let target: any;
    if (invite.type === 'LEAGUE') target = await League.findById(invite.targetId).select('name logo type settings');
    else target = await Tournament.findById(invite.targetId).select('name logo type format maxPlayers currentPlayers');
    if (!target) return notFoundResponse();
    return successResponse({ invite: { code: invite.code, type: invite.type, target } });
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { code } = await params;
    const invite = await Invite.findOne({ code: code.toUpperCase(), isActive: true });
    if (!invite) return notFoundResponse('Invalid code');
    if (invite.expiresAt && invite.expiresAt < new Date()) return errorResponse('Expired');
    if (invite.maxUses > 0 && invite.currentUses >= invite.maxUses) return errorResponse('Max uses');
    if (invite.type === 'LEAGUE') {
      const league = await League.findById(invite.targetId);
      if (!league) return notFoundResponse();
      if (league.participants.some((p: any) => p.toString() === user._id.toString())) return errorResponse('Already member');
      if (league.participants.length >= league.settings.maxPlayers) return errorResponse('Full');
      league.participants.push(user._id);
      await league.save();
    } else {
      const tournament = await Tournament.findById(invite.targetId);
      if (!tournament) return notFoundResponse();
      if (tournament.participants.some((p: any) => p.toString() === user._id.toString())) return errorResponse('Already registered');
      if (tournament.currentPlayers >= tournament.maxPlayers) return errorResponse('Full');
      tournament.participants.push(user._id); tournament.currentPlayers = tournament.participants.length;
      await tournament.save();
    }
    invite.currentUses += 1; await invite.save();
    return successResponse({ message: 'Joined successfully' });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
