import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

  try {
    const activities = await prisma.clubActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        message: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("[ActivityFeed] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
