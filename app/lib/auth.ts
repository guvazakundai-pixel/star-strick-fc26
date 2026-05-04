import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

export const prisma = new PrismaClient()

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-this-to-a-secure-random-string-in-production'
)

export interface Session { userId: string; email: string; role: string; fcUsername?: string | null }

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (!payload.userId) return null

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      fcUsername: payload.fcUsername as string | null,
    }
  } catch {
    return null
  }
}

export async function createJWT(session: Session): Promise<string> {
  return await new SignJWT({
    userId: session.userId,
    email: session.email,
    role: session.role,
    fcUsername: session.fcUsername,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
