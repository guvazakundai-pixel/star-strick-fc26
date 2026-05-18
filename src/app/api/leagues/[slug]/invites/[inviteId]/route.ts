import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

const PatchSchema = z.object({
  disabled: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; inviteId: string }> },
) {
  const { slug, inviteId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const invite = await prisma.inviteCode.findUnique({
    where: { id: inviteId },
    include: { league: { select: { ownerId: true, slug: true } } },
  });
  if (!invite || invite.league?.slug !== slug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = invite.league.ownerId === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.inviteCode.update({
    where: { id: inviteId },
    data: parsed.data,
  });
  return NextResponse.json({ invite: updated });
}
