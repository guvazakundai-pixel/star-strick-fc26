import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  const { status } = await req.json();
  if (!["DRAFT", "REGISTRATION", "LIVE", "COMPLETED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await prisma.tournament.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ success: true });
}
