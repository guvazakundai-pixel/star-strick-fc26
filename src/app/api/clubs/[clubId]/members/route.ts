import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  const session = auth.ok ? auth.session : null;

  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { createdByUserId: true } });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isManager = session?.userId === club.createdByUserId || session?.role === "ADMIN";
  const where = isManager
    ? { clubId }
    : { clubId, status: "APPROVED" as const };

  const members = await prisma.clubMember.findMany({
    where,
    orderBy: [{ status: "asc" }, { joinedAt: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          country: true,
          platform: true,
          stats: { select: { points: true, wins: true, losses: true, winStreak: true } },
        },
      },
    },
  });

  return NextResponse.json({ members });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true } });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const existingApproved = await prisma.clubMember.findFirst({
    where: { userId: auth.session.userId, status: "APPROVED" },
    select: { clubId: true },
  });
  if (existingApproved) {
    return NextResponse.json(
      { error: "You are already a member of another club" },
      { status: 409 },
    );
  }

  const member = await prisma.clubMember.upsert({
    where: { userId_clubId: { userId: auth.session.userId, clubId } },
    create: { userId: auth.session.userId, clubId, role: "PLAYER", status: "PENDING" },
    update: { status: "PENDING" },
  });

  return NextResponse.json({ member });
}