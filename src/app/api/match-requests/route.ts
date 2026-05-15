import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

const CreateSchema = z.object({
  receiverId: z.string().min(1),
  clubId: z.string().optional(),
  message: z.string().max(500).optional(),
  expiresInHours: z.number().int().min(1).max(168).default(24),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction") ?? "all";
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  let senderWhere = "";
  let receiverWhere = "";
  if (direction === "incoming") {
    receiverWhere = " AND mr.receiver_id = ?";
  } else if (direction === "outgoing") {
    senderWhere = " AND mr.sender_id = ?";
  } else {
    senderWhere = " AND (mr.sender_id = ? OR mr.receiver_id = ?)";
  }

  const statusFilter = status ? " AND mr.status = ?" : " AND mr.status = 'PENDING'";

  const countSql = `SELECT count(*) as c FROM match_requests mr WHERE 1=1${senderWhere}${receiverWhere}${statusFilter}`;
  const countArgs = direction === "all"
    ? [auth.session.userId, auth.session.userId, status || "PENDING"]
    : [auth.session.userId, status || "PENDING"];

  const countRes = await db.execute({ sql: countSql, args: countArgs });
  const total = Number((countRes.rows[0] as Record<string, unknown>)?.c ?? 0);

  const dataSql = `SELECT mr.id, mr.sender_id, mr.receiver_id, mr.club_id, mr.status, mr.message, mr.expires_at, mr.created_at,
    s.id as s_id, s.username as s_username, s.display_name as s_display_name, s.avatar_url as s_avatar_url,
    r.id as r_id, r.username as r_username, r.display_name as r_display_name, r.avatar_url as r_avatar_url
    FROM match_requests mr
    LEFT JOIN users s ON s.id = mr.sender_id
    LEFT JOIN users r ON r.id = mr.receiver_id
    WHERE 1=1${senderWhere}${receiverWhere}${statusFilter}
    ORDER BY mr.created_at DESC LIMIT ? OFFSET ?`;

  const dataArgs = direction === "all"
    ? [auth.session.userId, auth.session.userId, status || "PENDING", limit, offset]
    : [auth.session.userId, status || "PENDING", limit, offset];

  const dataRes = await db.execute({ sql: dataSql, args: dataArgs });

  const requests = dataRes.rows.map((row: Record<string, unknown>) => ({
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    clubId: row.club_id,
    status: row.status,
    message: row.message,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    sender: { id: row.s_id, username: row.s_username, displayName: row.s_display_name, avatarUrl: row.s_avatar_url },
    receiver: { id: row.r_id, username: row.r_username, displayName: row.r_display_name, avatarUrl: row.r_avatar_url },
  }));

  return NextResponse.json({ requests, total, page, totalPages: Math.ceil(total / limit) });
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

  const receiverRes = await db.execute({
    sql: "SELECT id, is_banned FROM users WHERE id = ?",
    args: [receiverId],
  });
  const receiver = receiverRes.rows[0] as Record<string, unknown> | undefined;
  if (!receiver) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  if (receiver.is_banned === 1 || receiver.is_banned === true) {
    return NextResponse.json({ error: "Cannot challenge a banned player" }, { status: 400 });
  }

  const existingRes = await db.execute({
    sql: "SELECT id FROM match_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'PENDING' LIMIT 1",
    args: [auth.session.userId, receiverId],
  });
  if (existingRes.rows.length > 0) {
    return NextResponse.json({ error: "You already have a pending request to this player" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  await db.execute({
    sql: "INSERT INTO match_requests (id, sender_id, receiver_id, club_id, status, status_raw, message, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'PENDING', 'PENDING', ?, ?, ?, ?)",
    args: [id, auth.session.userId, receiverId, clubId ?? null, message ?? null, expiresAt, now, now],
  });

  return NextResponse.json({
    request: {
      id,
      senderId: auth.session.userId,
      receiverId,
      clubId: clubId ?? null,
      status: "PENDING",
      message: message ?? null,
      expiresAt,
      createdAt: now,
    },
  }, { status: 201 });
}