import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

export async function GET() {
  const userId = "8db24149-2fdb-4dca-b7e1-fb62edb25c9b";
  const name = "Star Strick FC";
  const tag = "STRK";
  const slug = "star-strick-fc";
  const clubId = uuid();

  try {
    const existing = await db.execute({
      sql: "SELECT id FROM clubs WHERE slug=? OR tag=?",
      args: [slug, tag],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Club already exists", club: existing.rows[0] });
    }

    await db.execute({
      sql: `INSERT INTO clubs (id, name, slug, tag, description, city, country, manager_id, created_by_user_id, is_public, recruitment_status, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,1,'OPEN',?,?)`,
      args: [clubId, name, slug, tag, "Zimbabwe's premier esports organization — home of champions.", "Harare", "Zimbabwe", userId, userId, now(), now()],
    });

    await db.execute({
      sql: "INSERT INTO club_members (id, club_id, user_id, role, title, joined_at, status) VALUES (?,?,?,?,?,?,?)",
      args: [uuid(), clubId, userId, "OWNER", "Founder & Owner", now(), "ACTIVE"],
    });

    return NextResponse.json({ success: true, clubId, slug, name, tag });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
