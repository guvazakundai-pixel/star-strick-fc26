import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.user.update({
    where: { id: auth.id },
    data: { onboardingComplete: true },
  })

  return NextResponse.json({ success: true })
}
