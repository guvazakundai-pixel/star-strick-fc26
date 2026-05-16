import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Invite } from '@/lib/db/models/Invite';
import { getAuthUser } from '@/lib/utils/auth';
import { generateInviteCode } from '@/lib/utils/generate';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { type, targetId, maxUses, expiresInHours } = await req.json();
    if (!type || !targetId) return errorResponse('Type and targetId required');
    if (!['LEAGUE', 'TOURNAMENT'].includes(type)) return errorResponse('Type must be LEAGUE or TOURNAMENT');
    const invite = await Invite.create({ code: generateInviteCode(), type, targetId, createdBy: user._id, maxUses: maxUses || 0, currentUses: 0, expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 3600000) : undefined });
    return successResponse({ invite, link: `${process.env.NEXT_PUBLIC_URL || ''}/invite/${invite.code}` }, 201);
  } catch (error: any) { return errorResponse(error.message, 500); }
}
