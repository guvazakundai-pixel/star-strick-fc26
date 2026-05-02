import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const auth = getAuthFromHeaders(_request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { clubId } = await params

  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

  if (club.managerId !== auth.id && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const pending = await prisma.clubMember.findMany({
    where: { clubId, status: "PENDING" },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, playerStats: true } },
    },
    orderBy: { joinedAt: "asc" },
  })

  return NextResponse.json({ pending })
}
