import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Match } from '@/lib/db/models/Match';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB();
    const filter: any = { $or: [{ homePlayerId: user._id }, { awayPlayerId: user._id }] };
    const status = new URL(req.url).searchParams.get('status');
    if (status) filter.status = status;
    const matches = await Match.find(filter).populate('homePlayerId', 'username avatar').populate('awayPlayerId', 'username avatar').sort({ createdAt: -1 }).limit(50);
    return successResponse({ matches });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
