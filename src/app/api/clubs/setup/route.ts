import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";
import { PREMIUM_CLUBS } from "@/lib/club-templates";

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const results: { name: string; created: boolean; error?: string }[] = [];

  for (const club of PREMIUM_CLUBS) {
    try {
      const existing = await prisma.club.findUnique({ where: { name: club.name } });
      if (existing) {
        results.push({ name: club.name, created: false });
        continue;
      }

      const slug = club.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const joinCode = genCode();

      await prisma.club.create({
        data: {
          name: club.name,
          slug,
          tag: club.tag,
          tagline: club.description,
          city: club.city,
          country: "Zimbabwe",
          description: club.description,
          isPublic: club.isPublic,
          joinCode,
          isVerified: true,
          clubXp: 0,
          winRate: 0,
          momentum: 50,
          status: "APPROVED",
          managerId: auth.session.userId,
          createdByUserId: auth.session.userId,
        },
      });

      results.push({ name: club.name, created: true });
    } catch (e: any) {
      results.push({ name: club.name, created: false, error: e.message });
    }
  }

  return NextResponse.json({ success: true, data: results });
}
