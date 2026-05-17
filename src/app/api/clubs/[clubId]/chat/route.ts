import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

async function ensureClubRoom(clubId: string): Promise<string> {
  let room = await prisma.chatRoom.findFirst({ where: { clubId } });
  if (!room) {
    room = await prisma.chatRoom.create({
      data: { type: "CLUB", clubId, name: "General" },
    });
  }
  return room.id;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const member = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: auth.session.userId, clubId } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const roomId = await ensureClubRoom(clubId);
  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ messages, roomId });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const member = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: auth.session.userId, clubId } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { content } = await req.json();
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const roomId = await ensureClubRoom(clubId);
  const message = await prisma.chatMessage.create({
    data: { roomId, userId: auth.session.userId, content: content.trim() },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
