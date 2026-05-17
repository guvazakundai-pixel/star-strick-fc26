import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.session.userId;

  try {
    const friends = await prisma.friend.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }], status: "ACCEPTED" },
      select: {
        id: true,
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true, playerRanking: { select: { rankPosition: true } } } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true, playerRanking: { select: { rankPosition: true } } } },
      },
    });

    const mapped = friends.map((f) => {
      const friend = f.sender.id === userId ? f.receiver : f.sender;
      return { ...friend };
    });

    const requests = await prisma.friend.findMany({
      where: { receiverId: userId, status: "PENDING" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true, playerRanking: { select: { rankPosition: true } } } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true, playerRanking: { select: { rankPosition: true } } } },
      },
    });

    return NextResponse.json({ friends: mapped, requests });
  } catch (error) {
    console.error("[Friends] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
