import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models/User';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB();
    const q = new URL(req.url).searchParams.get('q');
    if (!q || q.length < 2) return successResponse({ users: [] });
    const users = await User.find({ username: { $regex: q, $options: 'i' }, _id: { $ne: user._id } }).select('username avatar rating stats').limit(20);
    return successResponse({ users });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
