import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await prisma.clubMember.findFirst({
    where: {
      userId: auth.id,
      status: "APPROVED",
    },
    include: {
      club: { select: { id: true, name: true, slug: true } },
    },
  })

  if (!membership) {
    return NextResponse.json({ club: null })
  }

  return NextResponse.json({ club: membership.club })
}
