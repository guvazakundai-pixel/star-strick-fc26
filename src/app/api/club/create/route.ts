import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

type Row = Record<string, unknown>;
function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }
async function q(sql: string, args: unknown[] = []) { const r = await db.execute({ sql, args }); return r.rows as Row[]; }

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "club";
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { name, tag, description, country, city, logoUrl, bannerUrl, isPublic, socialLinks } = await req.json();

  if (!name || !tag) return NextResponse.json({ error: "Name and tag required" }, { status: 400 });

  const existing = await q("SELECT id FROM clubs WHERE slug=? OR tag=?", [slugify(name), tag.toUpperCase()]);
  if (existing.length > 0) return NextResponse.json({ error: "Club name or tag already taken" }, { status: 409 });

  const existingMembership = await q("SELECT id FROM club_members WHERE user_id=? AND status='ACTIVE'", [auth.session.userId]);
  if (existingMembership.length > 0) return NextResponse.json({ error: "You already belong to an active club" }, { status: 409 });

  const clubId = uuid();
  const slug = slugify(name);

  await db.execute({
    sql: `INSERT INTO clubs (id, name, slug, tag, description, logo_url, banner_url, country, city, manager_id, owner_id, is_public, social_links, recruitment_status, created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [clubId, name, slug, tag.toUpperCase(), description || "", logoUrl || "", bannerUrl || "", country || "", city || "", auth.session.userId, auth.session.userId, isPublic ?? 1, socialLinks || "", "OPEN", now(), now()],
  });

  await db.execute({
    sql: "INSERT INTO club_members (id, club_id, user_id, role, title, joined_at, status) VALUES (?,?,?,?,?,?,?)",
    args: [uuid(), clubId, auth.session.userId, "OWNER", "Founder & Owner", now(), "ACTIVE"],
  });

  return NextResponse.json({ success: true, clubId, slug });
}
