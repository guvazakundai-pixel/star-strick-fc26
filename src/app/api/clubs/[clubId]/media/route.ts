import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireClubManager } from "@/lib/route-auth";
import { audit } from "@/lib/audit";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const MEDIA_TYPES = ["LOGO", "BANNER", "POST", "GALLERY"] as const;

const PostSchema = z.object({
  type: z.enum(MEDIA_TYPES),
  url: z.string().url(),
  caption: z.string().max(500).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const media = await prisma.media.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { username: true, displayName: true } } },
  });
  return NextResponse.json({ media });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireClubManager(clubId);
  if (!auth.ok) return auth.response;

  const rl = rateLimit(rateLimitKey(req, "media-upload", auth.session.userId), {
    windowMs: 60_000,
    max: 20,
  });
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // LOGO/BANNER are singletons — a new one replaces the previous on the Club row.
  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.media.create({
      data: {
        clubId,
        uploadedById: auth.session.userId,
        type: parsed.data.type,
        url: parsed.data.url,
        caption: parsed.data.caption,
      },
    });
    if (parsed.data.type === "LOGO") {
      await tx.club.update({ where: { id: clubId }, data: { logoUrl: parsed.data.url } });
    }
    if (parsed.data.type === "BANNER") {
      await tx.club.update({ where: { id: clubId }, data: { bannerUrl: parsed.data.url } });
    }
    return item;
  });

  await audit(auth.session.userId, "MEDIA_UPLOAD", "MEDIA", created.id, {
    clubId,
    type: parsed.data.type,
  });

  return NextResponse.json({ media: created });
}
