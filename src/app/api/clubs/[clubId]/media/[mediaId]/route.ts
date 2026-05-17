import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClubManager } from "@/lib/route-auth";
import { audit } from "@/lib/audit";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clubId: string; mediaId: string }> },
) {
  const { clubId, mediaId } = await params;
  const auth = await requireClubManager(clubId);
  if (!auth.ok) return auth.response;

  const item = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!item || item.clubId !== clubId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.media.delete({ where: { id: mediaId } });
  await audit(auth.session.userId, "MEDIA_DELETE", "MEDIA", mediaId, {
    clubId,
    type: item.type,
  });

  return NextResponse.json({ ok: true });
}
