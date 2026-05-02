import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    const publicPaths = ["/api/auth/register", "/api/auth/login"]
    if (publicPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.next()
    }

    const auth = getAuthFromHeaders(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (pathname.startsWith("/api/admin") && auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 })
    }

    if (pathname.startsWith("/api/manager") && !["MANAGER", "ADMIN"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden: Manager only" }, { status: 403 })
    }

    const response = NextResponse.next()
    response.headers.set("X-User-Id", auth.id)
    response.headers.set("X-User-Role", auth.role)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
}
