import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { generateInviteCode } from "@/lib/league/invites";

const CreateInviteSchema = z.object({
  maxUses: z.coerce.number().int().min(1).max(1000).optional(),
  expiresInHours: z.coerce.number().int().min(1).max(24 * 365).optional(),
});

export async function GET(
  _req: Request,
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

  const invites = await prisma.inviteCode.findMany({
    where: { leagueId: league.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invites });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, slug: true },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = league.ownerId === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CreateInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const prefix = league.slug.slice(0, 6).replace(/-/g, "").toUpperCase();
  const expiresAt = parsed.data.expiresInHours
    ? new Date(Date.now() + parsed.data.expiresInHours * 3600 * 1000)
    : null;

  let code = generateInviteCode(prefix);
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateInviteCode(prefix);
  }

  const invite = await prisma.inviteCode.create({
    data: {
      leagueId: league.id,
      code,
      createdById: auth.session.userId,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt,
    },
  });

  return NextResponse.json({ invite }, { status: 201 });
}
