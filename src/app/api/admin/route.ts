import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  if (type === "applications") {
    const applications = await prisma.managerApplication.findMany({
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ applications })
  }

  if (type === "clubs") {
    const clubs = await prisma.club.findMany({
      include: {
        manager: { select: { id: true, username: true, email: true } },
        _count: { select: { members: true } },
        globalRank: true,
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ clubs })
  }

  if (type === "users") {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ users })
  }

  return NextResponse.json({ error: "Invalid type param" }, { status: 400 })
}
