import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute("SELECT 1");
    const useTorso = !!(process.env.TURSO_DATABASE_URL && process.env.USE_TURSO === "true");
    const cols = await db.execute({ sql: "PRAGMA table_info(challenges)", args: [] });
    const columnNames = cols.rows.map((r: any) => r.name);
    return NextResponse.json({
      status: "ok",
      useTorso,
      hasExpiresAt: columnNames.includes("expires_at"),
      challengeColumns: columnNames,
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", error: e.message }, { status: 500 });
  }
}
