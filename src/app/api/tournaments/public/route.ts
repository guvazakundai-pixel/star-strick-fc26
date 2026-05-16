import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Tournament } from '@/lib/db/models/Tournament';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const filter: any = { type: 'PUBLIC' };
    const tournaments = await Tournament.find(filter).populate('adminId', 'username avatar').select('name logo type format status maxPlayers currentPlayers startDate createdAt').sort({ createdAt: -1 }).limit(20);
    const enriched = tournaments.map((t) => ({ _id: t._id, name: t.name, logo: t.logo, type: t.type, format: t.format, status: t.status, maxPlayers: t.maxPlayers, currentPlayers: t.currentPlayers, admin: t.adminId, startDate: t.startDate, createdAt: t.createdAt }));
    return successResponse({ tournaments: enriched });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
