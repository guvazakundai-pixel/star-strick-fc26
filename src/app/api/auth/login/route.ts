import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models/User';
import { signToken } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return errorResponse('Email and password required');
    await connectDB();
    const user = await User.findOne({ email }).select('+password');
    if (!user) return errorResponse('Invalid credentials', 401);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return errorResponse('Invalid credentials', 401);
    const token = signToken({ userId: user._id.toString(), username: user.username });
    const response = successResponse({ user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, rating: user.rating, stats: user.stats }, token });
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800, path: '/' });
    return response;
  } catch (error: any) { return errorResponse(error.message, 500); }
}
