import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const [users, clubs, matches, reports] = await Promise.all([
    prisma.user.count(),
    prisma.club.count(),
    prisma.matchReport.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    status: "healthy",
    metrics: {
      totalUsers: users,
      totalClubs: clubs,
      totalMatches: matches,
      pendingReports: reports,
    },
  });
}