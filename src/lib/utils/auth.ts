import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db/connection';
import { User, IUser } from '@/lib/db/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'star-strick-fc26-dev-secret';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload { userId: string; username: string; }

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try { return jwt.verify(token, JWT_SECRET) as JWTPayload; } catch { return null; }
}

export async function getAuthUser(): Promise<(IUser & { _id: any }) | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  await connectDB();
  return User.findById(payload.userId);
}
