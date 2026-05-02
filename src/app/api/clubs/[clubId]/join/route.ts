import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notifyUser } from "@/lib/utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { clubId } = await params

  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

  const existing = await prisma.clubMember.findFirst({
    where: { userId: auth.id, clubId },
  })
  if (existing) {
    if (existing.status === "APPROVED") return NextResponse.json({ error: "Already a member" }, { status: 409 })
    if (existing.status === "PENDING") return NextResponse.json({ error: "Request already pending" }, { status: 409 })
  }

  const member = await prisma.clubMember.upsert({
    where: { userId_clubId: { userId: auth.id, clubId } },
    create: {
      userId: auth.id,
      clubId,
      role: "PLAYER",
      status: "PENDING",
    },
    update: {
      status: "PENDING",
    },
  })

  await notifyUser(
    club.managerId,
    "JOIN_REQUEST",
    "New join request",
    `A player wants to join ${club.name}`,
    `/manager/dashboard`
  )

  return NextResponse.json({ member, message: "Join request sent" })
}
