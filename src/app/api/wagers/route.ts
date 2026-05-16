import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { notifyChallengeReceived } from "@/lib/whatsapp";

const CreateSchema = z.object({
  receiverId: z.string().min(1),
  amount: z.number().int().min(100).max(5000),
});

const WAGER_FEE_PERCENT = 5;

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const res = await db.execute({
    sql: `SELECT w.*,
          sender.username as sender_username, sender.display_name as sender_display_name, sender.whatsapp as sender_whatsapp,
          receiver.username as receiver_username, receiver.display_name as receiver_display_name, receiver.whatsapp as receiver_whatsapp
          FROM wagers w
          LEFT JOIN users sender ON sender.id = w.sender_id
          LEFT JOIN users receiver ON receiver.id = w.receiver_id
          WHERE w.sender_id = ? OR w.receiver_id = ?
          ORDER BY w.created_at DESC
          LIMIT 50`,
    args: [auth.session.userId, auth.session.userId],
  });

  const wagers = res.rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    amount: Number(r.amount ?? 0),
    fee: Math.round(Number(r.amount ?? 0) * WAGER_FEE_PERCENT / 100),
    status: r.status,
    senderUsername: r.sender_username ?? "unknown",
    senderDisplayName: r.sender_display_name ?? null,
    receiverUsername: r.receiver_username ?? "unknown",
    receiverDisplayName: r.receiver_display_name ?? null,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at ?? null,
  }));

  return NextResponse.json({ wagers });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { receiverId, amount } = parsed.data;

  if (receiverId === auth.session.userId) {
    return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 400 });
  }

  const receiverRes = await db.execute({
    sql: "SELECT id, username, display_name, whatsapp FROM users WHERE id = ?",
    args: [receiverId],
  });
  const receiver = receiverRes.rows[0] as Record<string, unknown> | undefined;
  if (!receiver) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const existingRes = await db.execute({
    sql: "SELECT id FROM wagers WHERE sender_id = ? AND receiver_id = ? AND status = 'PENDING'",
    args: [auth.session.userId, receiverId],
  });
  if (existingRes.rows.length > 0) {
    return NextResponse.json({ error: "You already have a pending wager with this player" }, { status: 409 });
  }

  try {
    await db.execute({
      sql: "CREATE TABLE IF NOT EXISTS wagers (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', created_at TEXT NOT NULL, resolved_at TEXT, winner_id TEXT, FOREIGN KEY (sender_id) REFERENCES users(id), FOREIGN KEY (receiver_id) REFERENCES users(id))",
      args: [],
    });
  } catch {}

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: "INSERT INTO wagers (id, sender_id, receiver_id, amount, status, created_at) VALUES (?, ?, ?, ?, 'PENDING', ?)",
    args: [id, auth.session.userId, receiverId, amount, now],
  });

  const senderName = auth.session.username;

  // WhatsApp notification to receiver
  if (receiver.whatsapp) {
    notifyChallengeReceived(receiver.whatsapp as string, senderName);
  }

  return NextResponse.json({
    wager: { id, senderId: auth.session.userId, receiverId, amount, status: "PENDING" },
  }, { status: 201 });
}
