import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { z } from "zod";

const AchievementSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  icon: z.string().default("🏆"),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;

  const achievements = await prisma.clubAchievement.findMany({
    where: { clubId },
    orderBy: { earnedAt: "desc" },
  });

  return NextResponse.json({ achievements });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const membership = await prisma.clubMember.findFirst({
    where: { userId: auth.session.userId, clubId, status: "APPROVED" },
    select: { role: true },
  });

  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
    return NextResponse.json({ error: "Only club owners and managers can add achievements" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AchievementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const achievement = await prisma.clubAchievement.create({
    data: {
      clubId,
      title: parsed.data.title,
      description: parsed.data.description,
      icon: parsed.data.icon,
      earnedAt: new Date(),
    },
  });

  await prisma.clubActivity.create({
    data: {
      clubId,
      userId: auth.session.userId,
      type: "ACHIEVEMENT",
      message: `New achievement unlocked: ${parsed.data.title}`,
      metadata: { achievementId: achievement.id },
    },
  });

  return NextResponse.json({ achievement }, { status: 201 });
}
