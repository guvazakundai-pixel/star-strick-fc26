import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      displayName: true,
      platform: true,
      country: true,
      clubId: true,
      isBanned: true,
      emailVerified: true,
      bio: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}
