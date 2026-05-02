import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

const createMediaSchema = z.object({
  clubId: z.string(),
  type: z.enum(["LOGO", "BANNER", "POST", "GALLERY"]),
  url: z.string().url(),
  caption: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = createMediaSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const club = await prisma.club.findUnique({ where: { id: parsed.data.clubId } })
  if (!club || club.managerId !== auth.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const media = await prisma.media.create({
    data: {
      uploadedById: auth.id,
      ...parsed.data,
    },
  })

  return NextResponse.json({ media }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clubId = searchParams.get("clubId")

  const where = clubId ? { clubId } : {}
  const media = await prisma.media.findMany({
    where,
    include: { uploadedBy: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ media })
}

export async function DELETE(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mediaId = searchParams.get("id")

  if (!mediaId) {
    return NextResponse.json({ error: "Missing media ID" }, { status: 400 })
  }

  const media = await prisma.media.findUnique({ where: { id: mediaId } })
  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 })
  }

  if (media.uploadedById !== auth.id && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.media.delete({ where: { id: mediaId } })
  return NextResponse.json({ success: true })
}
