import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      isVerified: true,
      playerStats: true,
      managedClub: {
        select: { id: true, name: true, slug: true, logoUrl: true, city: true },
      },
      _count: {
        select: {
          followers: true,
          followings: true,
          memberships: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const recentClubs = await prisma.clubMember.findMany({
    where: { userId: id, status: "APPROVED" },
    include: {
      club: { select: { id: true, name: true, slug: true, logoUrl: true, city: true, globalRank: true } },
    },
    take: 5,
  })

  return NextResponse.json({ user, recentClubs })
}

const updateProfileSchema = z.object({
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (id !== auth.id && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, username: true, bio: true, avatarUrl: true },
  })

  return NextResponse.json({ user: updated })
}
