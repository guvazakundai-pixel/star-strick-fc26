import { NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { recalculateGlobalRankings } from "@/lib/rankings"

export async function POST(request: Request) {
  const auth = getAuthFromHeaders(request)
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await recalculateGlobalRankings()
  return NextResponse.json({ updated })
}
