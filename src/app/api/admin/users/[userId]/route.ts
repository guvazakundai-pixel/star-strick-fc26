import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";
import { hashPassword } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const { userId } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.role) data.role = body.role;
  if (body.isShadowBanned !== undefined) data.isShadowBanned = body.isShadowBanned;
  if (body.password) data.passwordHash = await hashPassword(body.password);

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, username: true, role: true, isShadowBanned: true },
  });

  return NextResponse.json({ user });
}