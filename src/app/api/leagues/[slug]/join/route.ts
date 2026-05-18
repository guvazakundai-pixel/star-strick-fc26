import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { validateInvite } from "@/lib/league/invites";

const JoinSchema = z.object({
  code: z.string().min(3).max(64).optional(),
  password: z.string().max(64).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const league = await prisma.league.findUnique({
    where: { slug },
    select: {
      id: true,
      ownerId: true,
      joinPolicy: true,
      joinPasswordHash: true,
      maxPlayers: true,
      status: true,
    },
  });
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (league.status === "ARCHIVED" || league.status === "COMPLETED") {
    return NextResponse.json({ error: "League is closed" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: auth.session.userId } },
  });
  if (existing && existing.status === "ACTIVE") {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }
  if (existing && existing.status === "BANNED") {
    return NextResponse.json({ error: "You are banned from this league" }, { status: 403 });
  }

  const memberCount = await prisma.leagueMember.count({
    where: { leagueId: league.id, status: "ACTIVE" },
  });
  if (memberCount >= league.maxPlayers) {
    return NextResponse.json({ error: "League is full" }, { status: 400 });
  }

  let useInvite: { id: string } | null = null;

  switch (league.joinPolicy) {
    case "OPEN":
      break;
    case "PASSWORD": {
      if (!parsed.data.password || !league.joinPasswordHash) {
        return NextResponse.json({ error: "Password required" }, { status: 400 });
      }
      const ok = await bcrypt.compare(parsed.data.password, league.joinPasswordHash);
      if (!ok) return NextResponse.json({ error: "Wrong password" }, { status: 403 });
      break;
    }
    case "INVITE": {
      if (!parsed.data.code) {
        return NextResponse.json({ error: "Invite code required" }, { status: 400 });
      }
      const invite = await prisma.inviteCode.findUnique({
        where: { code: parsed.data.code.trim() },
      });
      if (!invite || invite.leagueId !== league.id) {
        return NextResponse.json({ error: "Invalid code" }, { status: 403 });
      }
      const validation = validateInvite(invite);
      if (!validation.ok) {
        return NextResponse.json({ error: `Invite ${validation.reason}` }, { status: 403 });
      }
      useInvite = { id: invite.id };
      break;
    }
    case "APPROVAL":
      // Phase 1: create as PENDING; owner approves later (UI TBD in Phase 2).
      break;
  }

  const initialStatus = league.joinPolicy === "APPROVAL" ? "PENDING" : "ACTIVE";

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.leagueMember.update({
        where: { id: existing.id },
        data: { status: initialStatus, joinedAt: new Date() },
      });
    } else {
      await tx.leagueMember.create({
        data: {
          leagueId: league.id,
          userId: auth.session.userId,
          status: initialStatus,
        },
      });
    }
    if (useInvite) {
      await tx.inviteCode.update({
        where: { id: useInvite.id },
        data: { uses: { increment: 1 } },
      });
    }
  });

  return NextResponse.json({ ok: true, status: initialStatus });
}
