import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

const CreateSchema = z.object({
  receiverId: z.string().min(1),
  clubId: z.string().optional(),
  message: z.string().max(500).optional(),
  expiresInHours: z.number().int().min(1).max(168).default(24),
});

const playerSelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;
const clubSelect = { id: true, name: true, tag: true } as const;

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction") ?? "all";
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const where: any = {};
  if (direction === "incoming") {
    where.receiverId = auth.session.userId;
  } else if (direction === "outgoing") {
    where.senderId = auth.session.userId;
  } else {
    where.OR = [
      { senderId: auth.session.userId },
      { receiverId: auth.session.userId },
    ];
  }
  if (status) {
    where.status = status;
  } else {
    where.status = { in: ["PENDING"] };
  }

  const [requests, total] = await Promise.all([
    prisma.matchRequest.findMany({
      where,
      include: {
        sender: { select: playerSelect },
        receiver: { select: playerSelect },
        club: { select: clubSelect },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.matchRequest.count({ where }),
  ]);

  return NextResponse.json({
    requests,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { receiverId, clubId, message, expiresInHours } = parsed.data;

  if (receiverId === auth.session.userId) {
    return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, isBanned: true },
  });
  if (!receiver) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  if (receiver.isBanned) {
    return NextResponse.json({ error: "Cannot challenge a banned player" }, { status: 400 });
  }

  const existingPending = await prisma.matchRequest.findFirst({
    where: {
      senderId: auth.session.userId,
      receiverId,
      status: "PENDING",
    },
  });
  if (existingPending) {
    return NextResponse.json({ error: "You already have a pending request to this player" }, { status: 409 });
  }

  const request = await prisma.matchRequest.create({
    data: {
      senderId: auth.session.userId,
      receiverId,
      clubId: clubId ?? null,
      status: "PENDING",
      statusRaw: "PENDING",
      message: message ?? null,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    },
    include: {
      sender: { select: playerSelect },
      receiver: { select: playerSelect },
      club: { select: clubSelect },
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}