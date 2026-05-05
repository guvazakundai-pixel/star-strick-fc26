import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier.toLowerCase() }],
    },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await prisma.loginAttempt.create({ data: { ip, userId: user?.id, success: false } });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.isBanned) {
    return NextResponse.json({ error: "Account suspended. Contact an admin." }, { status: 403 });
  }

  await prisma.loginAttempt.create({ data: { ip, userId: user.id, success: true } });

  await setSessionCookie({
    userId: user.id,
    username: user.username,
    role: user.role as Role,
  });
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      platform: user.platform,
    },
  });
}
