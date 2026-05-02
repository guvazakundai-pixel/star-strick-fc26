import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

const createPostSchema = z.object({
  clubId: z.string(),
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
  isAnnouncement: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const club = await prisma.club.findUnique({ where: { id: parsed.data.clubId } })
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

  const isMember = await prisma.clubMember.findFirst({
    where: { userId: auth.id, clubId: club.id, status: "APPROVED" },
  })

  if (!isMember && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "You must be a club member to post" }, { status: 403 })
  }

  const post = await prisma.clubPost.create({
    data: {
      clubId: parsed.data.clubId,
      authorId: auth.id,
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl ?? null,
      isAnnouncement: parsed.data.isAnnouncement ?? false,
    },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  const members = await prisma.clubMember.findMany({
    where: { clubId: club.id, status: "APPROVED", userId: { not: auth.id } },
    select: { userId: true },
  })

  for (const m of members) {
    await (await import("@/lib/utils")).notifyUser(
      m.userId,
      "POST_CREATED",
      `New post in ${club.name}`,
      parsed.data.content.slice(0, 100),
      `/clubs/${club.slug}`
    )
  }

  return NextResponse.json({ post }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clubId = searchParams.get("clubId")
  const page = parseInt(searchParams.get("page") ?? "0")
  const limit = parseInt(searchParams.get("limit") ?? "20")

  const where = clubId ? { clubId } : {}

  const posts = await prisma.clubPost.findMany({
    where,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      club: { select: { id: true, name: true, slug: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: [
      { isAnnouncement: "desc" },
      { createdAt: "desc" },
    ],
    skip: page * limit,
    take: limit,
  })

  const total = await prisma.clubPost.count({ where })

  return NextResponse.json({ posts, total, page, hasMore: (page + 1) * limit < total })
}
