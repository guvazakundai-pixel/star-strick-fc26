import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

const CreateClubSchema = z.object({
  name: z.string().min(3).max(40),
  tag: z.string().min(2).max(5).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
  isInviteOnly: z.boolean().default(false),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateClubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, tag, description, isInviteOnly } = parsed.data;

  const existingClub = await prisma.club.findFirst({
    where: { OR: [{ name }, { tag }] },
  });
  if (existingClub) {
    return NextResponse.json({ error: "Club name or tag already taken" }, { status: 409 });
  }

  const existingMemberCount = await prisma.clubMember.count({
    where: { userId: auth.session.userId, status: "APPROVED" },
  });
  if (existingMemberCount >= 1) {
    return NextResponse.json({ error: "You are already in a club. Leave your current club first." }, { status: 400 });
  }

  const club = await prisma.club.create({
    data: {
      name,
      tag,
      description,
      isInviteOnly,
      createdByUserId: auth.session.userId,
    },
  });

  await prisma.clubMember.create({
    data: {
      userId: auth.session.userId,
      clubId: club.id,
      role: "MANAGER",
      status: "APPROVED",
    },
  });

  await prisma.user.update({
    where: { id: auth.session.userId },
    data: { clubId: club.id, joinedClubAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.session.userId,
      actionType: "CLUB_CREATE",
      entityType: "CLUB",
      entityId: club.id,
      metadata: JSON.stringify({ name, tag }),
    },
  });

  return NextResponse.json({ club }, { status: 201 });
}