import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

const UpdateSchema = z.object({
  displayName: z.string().min(3).max(30).optional(),
  bio: z.string().max(200).optional(),
  country: z.string().max(60).optional(),
  platform: z.enum(["CROSSPLAY", "PS5", "XBOX", "PC"]).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const sets: string[] = [];
  const args: unknown[] = [];

  if (parsed.data.displayName !== undefined) {
    sets.push("display_name = ?");
    args.push(parsed.data.displayName);
  }
  if (parsed.data.bio !== undefined) {
    sets.push("bio = ?");
    args.push(parsed.data.bio);
  }
  if (parsed.data.country !== undefined) {
    sets.push("country = ?");
    args.push(parsed.data.country);
  }
  if (parsed.data.platform !== undefined) {
    sets.push("platform = ?");
    args.push(parsed.data.platform);
  }
  if (parsed.data.phone !== undefined) {
    sets.push("phone = ?");
    args.push(parsed.data.phone);
  }
  if (parsed.data.whatsapp !== undefined) {
    sets.push("whatsapp = ?");
    args.push(parsed.data.whatsapp);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  args.push(auth.session.userId);

  await db.execute({
    sql: `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });

  const result = await db.execute({
    sql: "SELECT id, username, display_name, bio, country, platform FROM users WHERE id = ?",
    args: [auth.session.userId],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  return NextResponse.json({
    user: {
      id: row?.id,
      username: row?.username,
      displayName: row?.display_name,
      bio: row?.bio,
      country: row?.country,
      platform: row?.platform,
    },
  });
}