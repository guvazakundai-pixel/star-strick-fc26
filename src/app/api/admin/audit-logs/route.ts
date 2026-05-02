import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const target = searchParams.get("target")

  const where: Record<string, unknown> = {}
  if (action) where.action = { contains: action, mode: "insensitive" }
  if (target) where.target = { contains: target, mode: "insensitive" }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      admin: { select: { username: true } },
    },
  })

  return NextResponse.json({ logs })
}
