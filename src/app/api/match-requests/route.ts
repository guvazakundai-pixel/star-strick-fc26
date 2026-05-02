import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notifyUser } from "@/lib/utils"

const requestSchema = z.object({
  receiverId: z.string(),
  clubId: z.string().optional(),
  message: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  if (auth.id === parsed.data.receiverId) {
    return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 400 })
  }

  const pendingExists = await prisma.matchRequest.findFirst({
    where: {
      senderId: auth.id,
      receiverId: parsed.data.receiverId,
      status: "PENDING",
    },
  })
  if (pendingExists) {
    return NextResponse.json({ error: "Pending request already exists" }, { status: 409 })
  }

  const matchRequest = await prisma.matchRequest.create({
    data: {
      senderId: auth.id,
      receiverId: parsed.data.receiverId,
      clubId: parsed.data.clubId ?? null,
      message: parsed.data.message ?? null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true, email: true } },
    },
  })

  await notifyUser(
    parsed.data.receiverId,
    "MATCH_RESULT",
    `${matchRequest.sender.username} challenged you!`,
    parsed.data.message ?? "Accept or decline the match request.",
    `/matches/requests`
  )

  try {
    const { sendMatchRequestEmail } = await import("@/lib/email")
    await sendMatchRequestEmail(
      matchRequest.receiver.email,
      matchRequest.receiver.username,
      matchRequest.sender.username
    )
  } catch {}

  return NextResponse.json({ matchRequest }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") ?? "received"

  const where = type === "sent"
    ? { senderId: auth.id, expiresAt: { gt: new Date() } }
    : { receiverId: auth.id, expiresAt: { gt: new Date() } }

  const requests = await prisma.matchRequest.findMany({
    where,
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true, playerStats: { select: { wins: true, losses: true, skillRating: true } } } },
      receiver: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ requests })
}
