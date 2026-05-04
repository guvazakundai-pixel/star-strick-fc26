import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

const UpdateSchema = z.object({
  displayName: z.string().min(3).max(30).optional(),
  bio: z.string().max(200).optional(),
  country: z.string().max(60).optional(),
  platform: z.enum(["CROSSPLAY", "PS5", "XBOX", "PC"]).optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.session.userId },
    data: parsed.data,
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      country: true,
      platform: true,
    },
  });

  return NextResponse.json({ user });
}