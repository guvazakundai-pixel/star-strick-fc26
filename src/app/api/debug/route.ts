import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function GET() {
  try {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    
    const result = await libsql.execute("SELECT count(*) as cnt FROM player_rankings");
    
    return NextResponse.json({ ok: true, count: result.rows[0].cnt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, name: e.name, stack: e.stack?.substring(0, 800) }, { status: 500 });
  }
}