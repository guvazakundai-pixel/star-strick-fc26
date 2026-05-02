import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { registerUser, generateToken } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { randomBytes } from "crypto"

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { username, email, password, phone } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      )
    }

    const { user, token } = await registerUser(username, email, password, phone)

    const verificationToken = randomBytes(32).toString("hex")
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry,
        playerStats: {
          create: {
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            goalsScored: 0,
            goalsConceded: 0,
            skillRating: 1000,
            formScore: 0,
            winStreak: 0,
            mvpCount: 0,
            formHistory: "",
          },
        },
      },
    })

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
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
      },
    })

    const response = NextResponse.json({ user: fullUser, token }, { status: 201 })
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    try {
      const { sendWelcomeEmail, sendVerificationEmail } = await import("@/lib/email")
      await sendWelcomeEmail(email, username)
      await sendVerificationEmail(email, username, verificationToken)
    } catch {
    }

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
