import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { friendId } = await req.json();
  if (!friendId) return NextResponse.json({ error: "Missing friendId" }, { status: 400 });

  const userId = auth.session.userId;

  await prisma.friend.deleteMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
  });

  return NextResponse.json({ success: true });
}
