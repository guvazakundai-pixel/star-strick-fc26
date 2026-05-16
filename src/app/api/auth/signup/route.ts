import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models/User';
import { signToken } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) return errorResponse('All fields required');
    await connectDB();
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return errorResponse(existing.email === email ? 'Email registered' : 'Username taken');
    const user = await User.create({ username, email, password });
    const token = signToken({ userId: user._id.toString(), username: user.username });
    const response = successResponse({ user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, rating: user.rating }, token }, 201);
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800, path: '/' });
    return response;
  } catch (error: any) {
    return errorResponse(error.code === 11000 ? 'Already exists' : error.message, 500);
  }
}
