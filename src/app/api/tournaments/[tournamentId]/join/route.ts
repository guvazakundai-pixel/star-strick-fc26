import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const assignedTeam = body.assignedTeam || null;

  const tournRes = await db.execute({
    sql: "SELECT id, status, max_players FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const tourn = tournRes.rows[0] as any;
  if (!tourn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (tourn.status !== "REGISTRATION") {
    return NextResponse.json({ error: "Registration is not open" }, { status: 400 });
  }

  const existingRes = await db.execute({
    sql: "SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
    args: [tournamentId, auth.session.userId],
  });
  if (existingRes.rows.length > 0) {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  const countRes = await db.execute({
    sql: "SELECT count(*) as c FROM tournament_participants WHERE tournament_id = ? AND status IN ('REGISTERED', 'ACTIVE')",
    args: [tournamentId],
  });
  const count = Number((countRes.rows[0] as any)?.c ?? 0);
  if (count >= Number(tourn.max_players)) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
  }

  try {
    await db.execute({ sql: "ALTER TABLE tournament_participants ADD COLUMN assigned_team TEXT", args: [] });
  } catch {}

  await db.execute({
    sql: "INSERT INTO tournament_participants (id, tournament_id, user_id, seed, status, assigned_team, created_at) VALUES (?, ?, ?, ?, 'REGISTERED', ?, ?)",
    args: [crypto.randomUUID(), tournamentId, auth.session.userId, count + 1, assignedTeam, new Date().toISOString()],
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const existingRes = await db.execute({
    sql: "SELECT id, status FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
    args: [tournamentId, auth.session.userId],
  });
  const row = existingRes.rows[0] as any;
  if (!row) return NextResponse.json({ error: "Not registered" }, { status: 404 });

  if (row.status === "ELIMINATED" || row.status === "WITHDRAWN") {
    return NextResponse.json({ error: "Cannot withdraw in current state" }, { status: 400 });
  }

  await db.execute({
    sql: "UPDATE tournament_participants SET status = 'WITHDRAWN' WHERE id = ?",
    args: [row.id],
  });

  return NextResponse.json({ success: true });
}
