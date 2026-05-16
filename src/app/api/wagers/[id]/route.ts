import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { notifyChallengeAccepted, notifyPaymentConfirmed, notifyWagerResult } from "@/lib/whatsapp";

const UpdateSchema = z.object({
  action: z.enum(["accept", "reject", "cancel", "resolve"]),
  winnerId: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const wagerRes = await db.execute({
    sql: `SELECT w.*,
          sender.username as sender_username, sender.display_name as sender_display_name, sender.whatsapp as sender_whatsapp,
          receiver.username as receiver_username, receiver.display_name as receiver_display_name, receiver.whatsapp as receiver_whatsapp
          FROM wagers w
          LEFT JOIN users sender ON sender.id = w.sender_id
          LEFT JOIN users receiver ON receiver.id = w.receiver_id
          WHERE w.id = ?`,
    args: [id],
  });
  const wager = wagerRes.rows[0] as Record<string, unknown> | undefined;
  if (!wager) {
    return NextResponse.json({ error: "Wager not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { action, winnerId } = parsed.data;
  const now = new Date().toISOString();

  if (action === "cancel") {
    if (wager.sender_id !== auth.session.userId && wager.receiver_id !== auth.session.userId) {
      return NextResponse.json({ error: "Not your wager" }, { status: 403 });
    }
    if (wager.status !== "PENDING") {
      return NextResponse.json({ error: "Wager already resolved" }, { status: 400 });
    }
    await db.execute({
      sql: "UPDATE wagers SET status = 'CANCELLED', resolved_at = ? WHERE id = ?",
      args: [now, id],
    });
    return NextResponse.json({ wager: { id, status: "CANCELLED" } });
  }

  if (action === "reject") {
    if (wager.receiver_id !== auth.session.userId) {
      return NextResponse.json({ error: "Only the receiver can reject" }, { status: 403 });
    }
    if (wager.status !== "PENDING") {
      return NextResponse.json({ error: "Wager already resolved" }, { status: 400 });
    }
    await db.execute({
      sql: "UPDATE wagers SET status = 'REJECTED', resolved_at = ? WHERE id = ?",
      args: [now, id],
    });
    return NextResponse.json({ wager: { id, status: "REJECTED" } });
  }

  if (action === "accept") {
    if (wager.receiver_id !== auth.session.userId) {
      return NextResponse.json({ error: "Only the receiver can accept" }, { status: 403 });
    }
    if (wager.status !== "PENDING") {
      return NextResponse.json({ error: "Wager already resolved" }, { status: 400 });
    }
    await db.execute({
      sql: "UPDATE wagers SET status = 'ACCEPTED' WHERE id = ?",
      args: [id],
    });

    // WhatsApp notification to sender
    const receiverName = (wager.receiver_display_name as string) ?? (wager.receiver_username as string);
    if (wager.sender_whatsapp) {
      notifyChallengeAccepted(wager.sender_whatsapp as string, receiverName);
    }

    return NextResponse.json({ wager: { id, status: "ACCEPTED" } });
  }

  if (action === "resolve") {
    if (!winnerId) {
      return NextResponse.json({ error: "winnerId required to resolve" }, { status: 400 });
    }
    if (wager.sender_id !== auth.session.userId && wager.receiver_id !== auth.session.userId) {
      return NextResponse.json({ error: "Not your wager" }, { status: 403 });
    }
    if (wager.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Wager must be accepted before resolving" }, { status: 400 });
    }
    if (winnerId !== wager.sender_id && winnerId !== wager.receiver_id) {
      return NextResponse.json({ error: "Winner must be sender or receiver" }, { status: 400 });
    }

    await db.execute({
      sql: "UPDATE wagers SET status = 'RESOLVED', winner_id = ?, resolved_at = ? WHERE id = ?",
      args: [winnerId, now, id],
    });

    const amount = Number(wager.amount ?? 0);
    const wonAmount = Math.round(amount * 2 * (100 - WAGER_FEE_PERCENT) / 100);

    // WhatsApp results
    const senderName = (wager.sender_display_name as string) ?? (wager.sender_username as string);
    const receiverName = (wager.receiver_display_name as string) ?? (wager.receiver_username as string);

    if (wager.sender_whatsapp) {
      notifyWagerResult(wager.sender_whatsapp as string, winnerId === wager.sender_id, wonAmount / 100, receiverName);
    }
    if (wager.receiver_whatsapp) {
      notifyWagerResult(wager.receiver_whatsapp as string, winnerId === wager.receiver_id, wonAmount / 100, senderName);
    }

    return NextResponse.json({ wager: { id, status: "RESOLVED", winnerId } });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

const WAGER_FEE_PERCENT = 5;
