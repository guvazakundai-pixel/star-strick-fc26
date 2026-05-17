import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { receiverId } = await req.json();
  if (!receiverId) return NextResponse.json({ error: "Missing receiverId" }, { status: 400 });

  if (receiverId === auth.session.userId) {
    return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
  }

  const existing = await prisma.friend.findFirst({
    where: {
      OR: [
        { senderId: auth.session.userId, receiverId },
        { senderId: receiverId, receiverId: auth.session.userId },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Request already exists" }, { status: 409 });
  }

  await prisma.friend.create({
    data: { senderId: auth.session.userId, receiverId, status: "PENDING" },
  });

  return NextResponse.json({ success: true });
}
