import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

const reportSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(["USER", "CLUB", "POST", "MATCH"]),
  reason: z.string().min(10).max(500),
})

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const report = await prisma.report.create({
    data: {
      reporterId: auth.id,
      targetId: parsed.data.targetId,
      targetType: parsed.data.targetType,
      reason: parsed.data.reason,
    },
  })

  return NextResponse.json({ report }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const where = status ? { status } : {}
  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ reports })
}
