import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

export async function GET() {
  const authed = await requireRole("ADMIN");
  if (authed) return authed;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isShadowBanned: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}