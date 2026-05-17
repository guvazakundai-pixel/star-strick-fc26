import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [matchActivities, clubActivities, tournamentActivities] = await Promise.all([
      prisma.userActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          message: true,
          createdAt: true,
          user: {
            select: { username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.clubActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          message: true,
          createdAt: true,
          user: {
            select: { username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.tournament.findMany({
        where: { status: { in: ["LIVE", "REGISTRATION"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          createdAt: true,
          organizer: {
            select: { username: true },
          },
        },
      }),
    ]);

    const activities = [
      ...matchActivities.map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        username: a.user.displayName || a.user.username,
        avatarUrl: a.user.avatarUrl,
        createdAt: a.createdAt.toISOString(),
      })),
      ...clubActivities.map((a) => ({
        id: `club_${a.id}`,
        type: a.type,
        message: a.message,
        username: a.user.displayName || a.user.username,
        avatarUrl: a.user.avatarUrl,
        createdAt: a.createdAt.toISOString(),
      })),
      ...tournamentActivities.map((t) => ({
        id: `tourn_${t.id}`,
        type: "TOURNAMENT",
        message: `${t.name} — ${t.status === "LIVE" ? "Now live" : "Registration open"}`,
        username: t.organizer.username,
        avatarUrl: null,
        createdAt: t.createdAt.toISOString(),
      })),
    ];

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ activities: activities.slice(0, 20) });
  } catch {
    return NextResponse.json({ activities: [] });
  }
}
