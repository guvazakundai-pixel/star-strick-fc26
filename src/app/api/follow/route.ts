import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { userId: followingId } = body

  if (followingId === auth.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: auth.id, followingId } },
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
    return NextResponse.json({ following: false })
  }

  await prisma.follow.create({
    data: { followerId: auth.id, followingId },
  })

  await (await import("@/lib/utils")).notifyUser(followingId, "SYSTEM_ALERT", "New follower", `${auth.id} started following you`)

  return NextResponse.json({ following: true })
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") ?? auth.id

  const followers = await prisma.follow.count({ where: { followingId: userId } })
  const following = await prisma.follow.count({ where: { followerId: userId } })
  const isFollowing = auth ? await prisma.follow.count({
    where: { followerId: auth.id, followingId: userId },
  }) > 0 : false

  return NextResponse.json({ followers, following, isFollowing })
}
