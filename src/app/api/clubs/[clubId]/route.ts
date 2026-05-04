import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireClubManager } from "@/lib/route-auth";

const PatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  tag: z.string().min(2).max(5).regex(/^[A-Z0-9]+$/).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  city: z.string().min(2).max(80).optional(),
  isInviteOnly: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      globalRanking: true,
      createdBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ club });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireClubManager(clubId);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = { ...parsed.data };

  if (parsed.data.tag) {
    const dupe = await prisma.club.findFirst({
      where: { tag: parsed.data.tag, NOT: { id: clubId } },
      select: { id: true },
    });
    if (dupe) {
      return NextResponse.json({ error: "Club tag already taken" }, { status: 409 });
    }
  }

  if (parsed.data.name) {
    const dupe = await prisma.club.findFirst({
      where: { name: parsed.data.name, NOT: { id: clubId } },
      select: { id: true },
    });
    if (dupe) {
      return NextResponse.json({ error: "Club name already taken" }, { status: 409 });
    }
  }

  const updated = await prisma.club.update({ where: { id: clubId }, data });

  await prisma.auditLog.create({
    data: {
      actorId: auth.session.userId,
      actionType: "CLUB_UPDATE",
      entityType: "CLUB",
      entityId: clubId,
      metadata: JSON.stringify(parsed.data),
    },
  });

  return NextResponse.json({ club: updated });
}