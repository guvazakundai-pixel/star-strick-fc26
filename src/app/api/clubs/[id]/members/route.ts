import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: clubId } = await params
  const body = await request.json()
  const { userId } = body

  if (userId !== auth.id) {
    return NextResponse.json({ error: "You can only join with your own account" }, { status: 403 })
  }

  const existing = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId, clubId } },
  })

  if (existing) {
    return NextResponse.json({ error: "Already a member or pending" }, { status: 409 })
  }

  const membership = await prisma.clubMember.create({
    data: { userId, clubId, role: "PLAYER", status: "PENDING" },
    include: { club: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ membership }, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clubId } = await params
  const members = await prisma.clubMember.findMany({
    where: { clubId },
    include: { user: { select: { id: true, username: true, avatarUrl: true, playerStats: true } } },
    orderBy: { joinedAt: "asc" },
  })
  return NextResponse.json({ members })
}
