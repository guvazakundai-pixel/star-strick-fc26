import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Tournament } from '@/lib/db/models/Tournament';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params;
    const tournament = await Tournament.findById(id).populate('adminId', 'username avatar').populate('participants', 'username avatar rating').populate('matches');
    if (!tournament) return notFoundResponse();
    return successResponse({ tournament });
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB(); const { id } = await params; const body = await req.json();
    const tournament = await Tournament.findById(id);
    if (!tournament) return notFoundResponse();
    if (tournament.adminId.toString() !== user._id.toString()) return unauthorizedResponse('Only admin');
    const allowed = ['name', 'description', 'logo', 'banner', 'status', 'rules'];
    allowed.forEach((f) => { if (body[f] !== undefined) (tournament as any)[f] = body[f]; });
    await tournament.save(); return successResponse({ tournament });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
