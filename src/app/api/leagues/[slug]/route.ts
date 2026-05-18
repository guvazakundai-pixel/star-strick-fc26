import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

const PatchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  region: z.string().max(80).optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
  joinPolicy: z.enum(["OPEN", "INVITE", "APPROVAL", "PASSWORD"]).optional(),
  status: z.enum(["DRAFT", "REGISTRATION", "LIVE", "COMPLETED", "ARCHIVED"]).optional(),
  maxPlayers: z.coerce.number().int().min(2).max(64).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      seasons: {
        orderBy: { seasonNumber: "desc" },
        include: {
          _count: { select: { participants: true, fixtures: true } },
        },
      },
    },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ league });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = league.ownerId === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await prisma.league.update({
    where: { id: league.id },
    data: parsed.data,
  });

  return NextResponse.json({ league: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, status: true },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = league.ownerId === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (league.status === "LIVE" && !isAdmin) {
    return NextResponse.json(
      { error: "Cannot delete a live league. Archive it instead." },
      { status: 400 },
    );
  }

  await prisma.league.delete({ where: { id: league.id } });
  return NextResponse.json({ ok: true });
}
