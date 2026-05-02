import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cookie = request.headers.get("cookie")

  let token: string | null = null

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7)
  } else if (cookie) {
    const match = cookie.match(/auth_token=([^;]+)/)
    if (match) token = match[1]
  }

  if (!token) {
    return NextResponse.json({ user: null })
  }

  try {
    const { verifyToken, getUserById } = await import("@/lib/auth")
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ user: null })
    }

    const user = await getUserById(decoded.id)
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null })
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0,
  })
  return response
}
