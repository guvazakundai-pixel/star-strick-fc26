import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    await db.execute({
      sql: "DELETE FROM league_participants WHERE league_id=? AND user_id=?",
      args: [id, auth.session.userId],
    });
    await db.execute({
      sql: "DELETE FROM league_standings WHERE league_id=? AND user_id=?",
      args: [id, auth.session.userId],
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
