import { NextResponse } from "next/server";
import { getSession } from "./session";
import { prisma } from "./prisma";
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
  if (result.session.role === "ADMIN") {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, createdByUserId: true },
    });
    if (!club) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Club not found" }, { status: 404 }),
      };
    }
    return { ok: true, session: result.session, club };
  }
  if (result.session.role !== "MANAGER") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, createdByUserId: true },
  });
  if (!club) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Club not found" }, { status: 404 }),
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
  return prisma.club.findFirst({
    where: { createdByUserId: session.userId },
    select: { id: true, name: true, tag: true, createdByUserId: true },
  });
}
