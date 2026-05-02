import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - start

    const userCount = await prisma.user.count()
    const clubCount = await prisma.club.count()
    const matchCount = await prisma.matchReport.count()

    const metrics = {
      database: { value: dbLatency < 100 ? 100 : dbLatency < 500 ? 80 : 50, label: "Database" },
      users: { value: Math.min(userCount * 2, 100), label: "User Growth" },
      activity: { value: Math.min(matchCount * 5, 100), label: "Activity" },
    }

    return NextResponse.json({ metrics, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({
      metrics: {
        database: { value: 0, label: "Database" },
        users: { value: 0, label: "User Growth" },
        activity: { value: 0, label: "Activity" },
      },
      error: "Health check failed",
    })
  }
}
