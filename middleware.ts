import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"

const PUBLIC_PATHS = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/me",
  "/api/clubs",
  "/api/search",
]

const ADMIN_ONLY = [
  "/api/admin",
  "/api/reports",
]

const MANAGER_OR_ADMIN = [
  "/api/manager",
  "/api/upload",
  "/api/clubs/[clubId]/rankings",
  "/api/clubs/[clubId]/members",
  "/api/clubs/[clubId]/pending-members",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // GET requests to clubs/search are public
  if (pathname.startsWith("/api/clubs") && request.method === "GET") {
    return NextResponse.next()
  }

  // Check auth
  const auth = getAuthFromHeaders(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Role-based access
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }

  if (MANAGER_OR_ADMIN.some((p) => pathname.startsWith(p)) && !["MANAGER", "ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden: Manager access required" }, { status: 403 })
  }

  // Prevent shadow-banned users from most actions
  if (auth.role === "PLAYER") {
    const { prisma } = await import("@/lib/db")
    const user = await prisma.user.findUnique({ where: { id: auth.id }, select: { isShadowBanned: true } })
    if (user?.isShadowBanned) {
      return NextResponse.json({ error: "Account restricted" }, { status: 403 })
    }
  }

  const response = NextResponse.next()
  response.headers.set("X-User-Id", auth.id)
  response.headers.set("X-User-Role", auth.role)
  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
