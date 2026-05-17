import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, username: true, displayName: true } },
      participants: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { joinedAt: "asc" },
      },
      standings: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { points: "desc" },
      },
      fixtures: {
        include: {
          homeUser: { select: { id: true, username: true, displayName: true } },
          awayUser: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: [{ matchday: "asc" }, { createdAt: "asc" }],
      },
      seasons: { orderBy: { seasonNumber: "desc" } },
      _count: { select: { participants: true } },
    },
  });

  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: league });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (league.adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.league.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      description: body.description ?? undefined,
      type: body.type ?? undefined,
      maxPlayers: body.maxPlayers ?? undefined,
      rounds: body.rounds ?? undefined,
      homeAway: body.homeAway ?? undefined,
      status: body.status ?? undefined,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (league.adminId !== auth.session.userId && auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.league.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
