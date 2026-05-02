import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { reportId } = await params
  const body = await request.json()
  const { action } = body

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 })
  }

  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: action === "DISMISS" ? "DISMISSED" : "RESOLVED",
      action,
      reviewedById: auth.id,
    },
  })

  // Execute the action
  if (action === "BAN_USER") {
    await prisma.user.update({
      where: { id: report.targetId },
      data: { isShadowBanned: true },
    })
  } else if (action === "SHADOW_BAN") {
    await prisma.user.update({
      where: { id: report.targetId },
      data: { isShadowBanned: true },
    })
  } else if (action === "DELETE_CONTENT" && report.targetType === "POST") {
    await prisma.clubPost.delete({ where: { id: report.targetId } }).catch(() => {})
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      adminId: auth.id,
      action: "REPORT_RESOLVE",
      target: `report:${reportId}`,
      details: { reportId, action, targetType: report.targetType, targetId: report.targetId },
    },
  })

  return NextResponse.json({ report })
}
