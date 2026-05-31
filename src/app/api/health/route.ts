import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute("SELECT 1");
    const tursoUrl = process.env.TURSO_DATABASE_URL || "(not set)";
    const useTurso = !!(process.env.TURSO_DATABASE_URL && process.env.USE_TURSO === "true");
    const dbHost = tursoUrl.replace(/libsql:\/\//, "").split(".")[0];
    const cols = await db.execute({ sql: "PRAGMA table_info(challenges)", args: [] });
    const columnNames = cols.rows.map((r: any) => r.name);
    const users = await db.execute({ sql: "SELECT count(*) as c FROM users", args: [] });
    return NextResponse.json({
      status: "ok",
      useTurso,
      dbHost,
      hasExpiresAt: columnNames.includes("expires_at"),
      challengeColumns: columnNames,
      userCount: users.rows[0]?.c,
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", error: e.message }, { status: 500 });
  }
}
