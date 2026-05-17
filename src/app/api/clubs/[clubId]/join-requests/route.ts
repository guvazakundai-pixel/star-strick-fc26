import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

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
  const isManager = member?.role === "OWNER" || member?.role === "MANAGER";
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await prisma.clubJoinRequest.findMany({
    where: { clubId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const existing = await prisma.clubJoinRequest.findUnique({
    where: { clubId_userId: { clubId, userId: auth.session.userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already requested" }, { status: 400 });
  }

  const membership = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: auth.session.userId, clubId } },
  });
  if (membership) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  const { message } = await req.json();

  const request = await prisma.clubJoinRequest.create({
    data: {
      clubId,
      userId: auth.session.userId,
      message: message || null,
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}
