import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { League } from '@/lib/db/models/League';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params;
    const league = await League.findById(id).populate('adminId', 'username avatar').populate('participants', 'username avatar rating stats');
    if (!league) return notFoundResponse();
    const currentSeason = league.seasons.find((s: any) => s.seasonNumber === league.currentSeason);
    return successResponse({ league: { ...league.toObject(), currentSeasonData: currentSeason || null } });
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params; const body = await req.json();
    const league = await League.findById(id);
    if (!league) return notFoundResponse();
    if (league.adminId.toString() !== user._id.toString()) return unauthorizedResponse('Only admin');
    const allowed = ['name', 'description', 'logo', 'banner', 'region', 'settings'];
    allowed.forEach((f) => { if (body[f] !== undefined) (league as any)[f] = body[f]; });
    await league.save(); return successResponse({ league });
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params;
    const league = await League.findById(id);
    if (!league) return notFoundResponse();
    if (league.adminId.toString() !== user._id.toString()) return unauthorizedResponse('Only admin');
    await League.findByIdAndDelete(id); return successResponse({ message: 'Deleted' });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
