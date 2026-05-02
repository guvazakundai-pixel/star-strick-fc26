import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

const createClubSchema = z.object({
  name: z.string().min(3).max(50),
  city: z.string().min(2).max(50),
  country: z.string().optional(),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["MANAGER", "ADMIN"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden: Manager role required" }, { status: 403 })
  }

  const existingClub = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { managedClubId: true },
  })

  if (existingClub?.managedClubId) {
    return NextResponse.json({ error: "You already manage a club" }, { status: 409 })
  }

  try {
    const body = await request.json()
    const parsed = createClubSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 }
      )
    }

    const slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const club = await prisma.club.create({
      data: {
        ...parsed.data,
        country: parsed.data.country ?? "Zimbabwe",
        slug,
        managerId: auth.id,
      },
      include: {
        manager: { select: { id: true, username: true } },
      },
    })

    await prisma.globalClubRanking.create({
      data: { clubId: club.id, rankPosition: 999, totalPoints: 0, wins: 0, losses: 0 },
    })

    return NextResponse.json({ club }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create club"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  const clubs = await prisma.club.findMany({
    include: {
      manager: { select: { id: true, username: true, avatarUrl: true } },
      globalRank: true,
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ clubs })
}
