import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  await prisma.notification.updateMany({
    where: { id, userId: auth.session.userId },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
