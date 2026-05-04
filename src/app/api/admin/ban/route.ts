import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

const BanSchema = z.object({
  userId: z.string().min(1),
  banned: z.boolean(),
});

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = BanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { userId, banned } = parsed.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: banned },
    select: { id: true, username: true, isBanned: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.session.userId,
      actionType: banned ? "USER_BAN" : "USER_UNBAN",
      entityType: "USER",
      entityId: userId,
      metadata: JSON.stringify({ username: user.username }),
    },
  });

  return NextResponse.json({ user });
}