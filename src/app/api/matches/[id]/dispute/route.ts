import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Match } from '@/lib/db/models/Match';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params; const { reason } = await req.json();
    if (!reason) return errorResponse('Reason required');
    const match = await Match.findById(id);
    if (!match) return notFoundResponse();
    const isHome = match.homePlayerId.toString() === user._id.toString();
    const isAway = match.awayPlayerId.toString() === user._id.toString();
    if (!isHome && !isAway) return unauthorizedResponse('Not your match');
    match.status = 'DISPUTED'; match.disputeReason = reason;
    match.confirmation.home = 'DISPUTED'; match.confirmation.away = 'DISPUTED';
    await match.save(); return successResponse({ match });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
