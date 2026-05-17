import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  try {
    const disputes = await prisma.dispute.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { reporter: { select: { id: true, username: true } } },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("[AdminDisputes] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
