import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params
  const body = await request.json()

  const { role, isShadowBanned, isVerified } = body

  const data: Record<string, unknown> = {}
  if (role) data.role = role
  if (typeof isShadowBanned === "boolean") data.isShadowBanned = isShadowBanned
  if (typeof isVerified === "boolean") data.isVerified = isVerified

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isShadowBanned: true,
      isVerified: true,
      createdAt: true,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      adminId: auth.id,
      action: role ? "ADMIN_ROLE_CHANGE" : isShadowBanned ? "USER_SHADOW_BAN" : "USER_UPDATE",
      target: `user:${userId}`,
      details: { changes: data },
    },
  })

  return NextResponse.json({ user })
}
