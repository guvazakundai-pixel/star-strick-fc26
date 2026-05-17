import { NextResponse } from "next/server";
import { getSession } from "./session";
import { db } from "./db";
import type { Role, SessionPayload } from "./auth";

export type AuthOk = { ok: true; session: SessionPayload };
export type AuthFail = { ok: false; response: NextResponse };
export type AuthResult = AuthOk | AuthFail;

export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;
  if (!roles.includes(result.session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}

export async function requireClubManager(
  clubId: string,
): Promise<AuthResult & { club?: { id: string; createdByUserId: string } }> {
  const result = await requireAuth();
  if (!result.ok) return result;

  const clubResult = await db.execute({
    sql: "SELECT id, created_by_user_id FROM clubs WHERE id = ?",
    args: [clubId],
  });
  const row = clubResult.rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Club not found" }, { status: 404 }),
    };
  }

  const club = {
    id: String(row.id),
    createdByUserId: String(row.created_by_user_id),
  };

  if (result.session.role === "ADMIN") {
    return { ok: true, session: result.session, club };
  }
  if (result.session.role !== "MANAGER") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  if (club.createdByUserId !== result.session.userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You can only manage your own club" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, session: result.session, club };
}

export async function getMyClub(session: SessionPayload) {
  const result = await db.execute({
    sql: "SELECT id, name, tag, created_by_user_id FROM clubs WHERE created_by_user_id = ? LIMIT 1",
    args: [session.userId],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    tag: String(row.tag),
    createdByUserId: String(row.created_by_user_id),
  };
}