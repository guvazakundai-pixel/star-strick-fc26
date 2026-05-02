import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

const applySchema = z.object({
  clubNameRequested: z.string().min(3).max(50),
  description: z.string().min(20).max(500),
})

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const parsed = applySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.errors },
      { status: 400 }
    )
  }

  const existing = await prisma.managerApplication.findFirst({
    where: { userId: auth.id, status: "PENDING" },
  })

  if (existing) {
    return NextResponse.json(
      { error: "You already have a pending application" },
      { status: 409 }
    )
  }

  const application = await prisma.managerApplication.create({
    data: {
      userId: auth.id,
      clubNameRequested: parsed.data.clubNameRequested,
      description: parsed.data.description,
    },
  })

  return NextResponse.json({ application }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const applications = await prisma.managerApplication.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ applications })
}
