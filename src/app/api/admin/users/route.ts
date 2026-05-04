import { NextResponse } from "next/server";
import { requireRole } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q } },
        { email: { contains: q } },
        { displayName: { contains: q } },
        { id: q },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      isBanned: true,
      platform: true,
      createdAt: true,
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}