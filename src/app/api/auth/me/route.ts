import { NextResponse } from "next/server"
import { getAuthFromHeaders, getUserById } from "@/lib/auth"

export async function GET(request: Request) {
  const auth = getAuthFromHeaders(request)
  if (!auth) {
    return NextResponse.json({ user: null })
  }

  try {
    const user = await getUserById(auth.id)
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
