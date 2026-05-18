import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, type Role } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  const result = await db.execute({
    sql: "SELECT id, username, email, password_hash, role, display_name, platform, is_banned FROM users WHERE LOWER(username) = LOWER(?) OR email = ? LIMIT 1",
    args: [identifier, identifier.toLowerCase()],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const passwordHash = typeof row.password_hash === "string" ? row.password_hash : String(row.password_hash);
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (row.is_banned === 1 || row.is_banned === true) {
    return NextResponse.json({ error: "Account suspended. Contact an admin." }, { status: 403 });
  }

  const userId = String(row.id);
  const username = String(row.username);
  const role = String(row.role) as Role;

  await setSessionCookie({ userId, username, role });

  return NextResponse.json({
    user: {
      id: userId,
      username,
      email: row.email,
      role,
      displayName: row.display_name,
      platform: row.platform,
    },
  });
}