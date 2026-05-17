import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json({ users: [] });

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
        NOT: { id: auth.session.userId },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        playerRanking: { select: { rankPosition: true } },
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[UserSearch] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
