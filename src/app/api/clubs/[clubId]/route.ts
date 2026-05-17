import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClubManager } from "@/lib/route-auth";
import { z } from "zod";

const PatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  tag: z.string().min(2).max(5).regex(/^[A-Z0-9]+$/).optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  city: z.string().min(2).max(80).optional(),
  membersInviteOnly: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      globalRank: true,
      manager: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      createdBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { members: true, achievements: true, activity: true, posts: true } },
    },
  });

  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await prisma.clubMember.findMany({
    where: { clubId, status: "APPROVED" },
    orderBy: [{ clubXp: "desc" }, { joinedAt: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          country: true,
          stats: { select: { points: true, wins: true, losses: true, draws: true, skillRating: true, winStreak: true } },
          playerRanking: { select: { rankPosition: true } },
        },
      },
    },
  });

  const achievements = await prisma.clubAchievement.findMany({
    where: { clubId },
    orderBy: { earnedAt: "desc" },
  });

  const recentActivity = await prisma.clubActivity.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  const rivals = await prisma.rivalry.findMany({
    where: {
      OR: [{ club1Id: clubId }, { club2Id: clubId }],
    },
    include: {
      club1: { select: { id: true, name: true, slug: true, tag: true, logoUrl: true, clubXp: true, globalRank: { select: { rankPosition: true } } } },
      club2: { select: { id: true, name: true, slug: true, tag: true, logoUrl: true, clubXp: true, globalRank: { select: { rankPosition: true } } } },
    },
  });

  const rivalryData = rivals.map((r) => {
    const isClub1 = r.club1Id === clubId;
    const rival = isClub1 ? r.club2 : r.club1;
    return {
      clubId: rival.id,
      name: rival.name,
      slug: rival.slug,
      tag: rival.tag,
      logoUrl: rival.logoUrl,
      clubXp: rival.clubXp,
      rank: rival.globalRank?.rankPosition ?? 0,
      ourWins: isClub1 ? r.club1Wins : r.club2Wins,
      theirWins: isClub1 ? r.club2Wins : r.club1Wins,
      draws: r.draws,
    };
  });

  const recentMatches = await prisma.matchReport.findMany({
    where: { clubId, status: { in: ["CONFIRMED", "APPROVED"] } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      player1: { select: { id: true, username: true, displayName: true } },
      player2: { select: { id: true, username: true, displayName: true } },
      winner: { select: { id: true, username: true, displayName: true } },
    },
  });

  return NextResponse.json({
    club: {
      ...club,
      featuredLegends: club.featuredLegends ? JSON.parse(club.featuredLegends) : [],
      trophies: club.trophies ? JSON.parse(club.trophies) : [],
      memberCount: club._count.members,
      achievementCount: club._count.achievements,
      activityCount: club._count.activity,
      postCount: club._count.posts,
    },
    members,
    achievements,
    recentActivity,
    rivals: rivalryData,
    recentMatches,
  });
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

  const data: any = { ...parsed.data };

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
      adminId: auth.session.userId,
      action: "CLUB_UPDATE",
      target: `CLUB:${clubId}`,
      details: parsed.data,
    },
  });

  return NextResponse.json({ club: updated });
}
