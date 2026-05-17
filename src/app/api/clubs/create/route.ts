import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

const CreateClubSchema = z.object({
  name: z.string().min(3).max(40),
  tag: z.string().min(2).max(5).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
  membersInviteOnly: z.boolean().default(false),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateClubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, tag, description, membersInviteOnly } = parsed.data;

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
      membersInviteOnly,
      createdByUserId: auth.session.userId,
      managerId: auth.session.userId,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      city: "Harare",
    },
  });

  await prisma.clubMember.create({
    data: {
      userId: auth.session.userId,
      clubId: club.id,
      role: "OWNER",
      status: "APPROVED",
    },
  });

  await prisma.user.update({
    where: { id: auth.session.userId },
    data: { clubId: club.id, joinedClubAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      adminId: auth.session.userId,
      action: "CLUB_CREATE",
      target: `CLUB:${club.id}`,
      details: { name, tag },
    },
  });

  return NextResponse.json({ club }, { status: 201 });
}