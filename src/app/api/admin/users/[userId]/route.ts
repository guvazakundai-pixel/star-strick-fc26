import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authed = await requireRole("ADMIN");
  if (authed) return authed;

  const { userId } = await params;
  const body = await req.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(body.role && { role: body.role }),
      ...(body.isShadowBanned !== undefined && { isShadowBanned: body.isShadowBanned }),
    },
    select: { id: true, username: true, role: true, isShadowBanned: true },
  });

  return NextResponse.json({ user });
}