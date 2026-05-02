import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "./db"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-prod"
const JWT_EXPIRES_IN = "7d"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): { id: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string }
  } catch {
    return null
  }
}

export async function registerUser(username: string, email: string, password: string, phone?: string) {
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      username,
      email,
      phone: phone ?? null,
      passwordHash,
      role: "PLAYER",
      playerStatus: "UNPLACED",
      playerStats: { create: {} },
    },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      playerStatus: true,
      avatarUrl: true,
      isVerified: true,
      onboardingComplete: true,
      createdAt: true,
    },
  })

  const token = generateToken({ id: user.id, role: user.role })
  return { user, token }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return null

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  const token = generateToken({ id: user.id, role: user.role })
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      playerStatus: user.playerStatus,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      onboardingComplete: user.onboardingComplete,
    },
    token,
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      playerStats: true,
    },
  })
}

export function setAuthCookie(res: Response, token: string) {
  res.headers.set(
    "Set-Cookie",
    `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  )
}

export function clearAuthCookie(res: Response) {
  res.headers.set("Set-Cookie", "auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
}

export function getAuthFromHeaders(request: Request): { id: string; role: string } | null {
  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    return verifyToken(auth.slice(7))
  }

  const cookie = request.headers.get("cookie")
  if (cookie) {
    const match = cookie.match(/auth_token=([^;]+)/)
    if (match) {
      return verifyToken(match[1])
    }
  }

  return null
}
