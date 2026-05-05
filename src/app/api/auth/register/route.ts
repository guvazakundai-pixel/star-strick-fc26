import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

const PLATFORMS = ["CROSSPLAY", "PS5", "XBOX", "PC"] as const;

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "letters, numbers, underscores only"),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(3).max(30),
  platform: z.enum(PLATFORMS).default("CROSSPLAY"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { username, email, password, displayName, platform } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Username or email already taken" },
      { status: 409 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const loginsToday = await prisma.loginAttempt.count({
    where: { ip: req.headers.get("x-forwarded-for") ?? "unknown", success: true, createdAt: { gte: today } },
  });
  if (loginsToday >= 3) {
    return NextResponse.json(
      { error: "Account limit reached for this device. Contact an admin." },
      { status: 429 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, email, passwordHash, displayName, platform, role: "PLAYER" },
    select: { id: true, username: true, email: true, role: true, displayName: true, platform: true },
  });

  await setSessionCookie({ userId: user.id, username: user.username, role: "PLAYER" });

  return NextResponse.json({ user });
}
