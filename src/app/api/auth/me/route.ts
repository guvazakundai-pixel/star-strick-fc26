import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const result = await db.execute({
    sql: `SELECT id, username, email, role, avatar_url, display_name, platform, country, club_id, is_banned, is_verified, bio, created_at FROM users WHERE id = ?`,
    args: [auth.session.userId],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      avatarUrl: row.avatar_url,
      displayName: row.display_name,
      platform: row.platform,
      country: row.country,
      clubId: row.club_id,
      isBanned: row.is_banned,
      isVerified: row.is_verified,
      bio: row.bio,
      createdAt: row.created_at,
    },
  });
}