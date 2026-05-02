import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { applicationId } = await params
  const body = await request.json()
  const parsed = reviewSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const application = await prisma.managerApplication.findUnique({
    where: { id: applicationId },
    include: { user: true },
  })

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "Application already reviewed" }, { status: 409 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const app = await tx.managerApplication.update({
      where: { id: applicationId },
      data: { status: parsed.data.status, reviewedById: auth.id },
    })

    if (parsed.data.status === "APPROVED") {
      await tx.user.update({
        where: { id: application.userId },
        data: { role: "MANAGER" },
      })
    }

    return app
  })

  return NextResponse.json({ application: updated })
}
