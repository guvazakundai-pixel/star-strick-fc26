import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { League } from '@/lib/db/models/League';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '20');
    const leagues = await League.find({ type: 'PUBLIC' }).populate('adminId', 'username avatar').select('name logo type region participants currentSeason createdAt').sort({ createdAt: -1 }).limit(limit);
    const enriched = leagues.map((l) => ({ _id: l._id, name: l.name, logo: l.logo, type: l.type, region: l.region, admin: l.adminId, playerCount: l.participants.length, currentSeason: l.currentSeason, createdAt: l.createdAt }));
    return successResponse({ leagues: enriched });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
