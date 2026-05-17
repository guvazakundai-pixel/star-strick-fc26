import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  const { resolution, action } = await req.json();

  await prisma.dispute.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolution: resolution || "Resolved",
      resolvedById: auth.session.userId,
      resolvedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
