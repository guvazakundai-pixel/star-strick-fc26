import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  await prisma.notificationV2.updateMany({
    where: { userId: auth.session.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
