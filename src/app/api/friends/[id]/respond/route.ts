import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { accept } = await req.json();

  const request = await prisma.friend.findUnique({ where: { id } });
  if (!request || request.receiverId !== auth.session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.friend.update({
    where: { id },
    data: { status: accept ? "ACCEPTED" : "BLOCKED" },
  });

  return NextResponse.json({ success: true });
}
