import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { auditAction, notifyUser } from "@/lib/utils"

const updateMemberSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]).optional(),
  role: z.enum(["PLAYER", "CO_MANAGER"]).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; memberId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { clubId, memberId } = await params

  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club || club.managerId !== auth.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const member = await prisma.clubMember.update({
    where: { id: memberId },
    data: parsed.data,
    include: { user: { select: { id: true, username: true } } },
  })

  // Audit log
  await auditAction(auth.id, `MEMBER_${parsed.data.status || parsed.data.role}`, `member:${memberId}`, {
    clubId,
    userId: member.userId,
    action: parsed.data.status || parsed.data.role,
  })

  // Notify user
  if (parsed.data.status) {
    const isApproved = parsed.data.status === "APPROVED"
    await notifyUser(
      member.userId,
      isApproved ? "JOIN_APPROVED" : "JOIN_REJECTED",
      isApproved ? `Welcome to ${club.name}!` : `Join request to ${club.name}`,
      isApproved ? "Your request has been approved. You're now a member!" : "Your request was not approved."
    )
  }

  return NextResponse.json({ member })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clubId: string; memberId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { clubId, memberId } = await params

  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club || club.managerId !== auth.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.clubMember.delete({ where: { id: memberId } })
  return NextResponse.json({ success: true })
}
