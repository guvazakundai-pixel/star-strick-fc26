import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { registerUser } from "@/lib/auth"

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6),
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

    const { username, email, password } = parsed.data

    const existing = await (import("@/lib/db").then((m) => m.prisma))
      .user.findFirst({
        where: { OR: [{ username }, { email }] },
      })

    if (existing) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      )
    }

    const { user, token } = await registerUser(username, email, password)

    const response = NextResponse.json({ user, token }, { status: 201 })
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
