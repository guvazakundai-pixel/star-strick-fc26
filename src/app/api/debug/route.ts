import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

export async function GET() {
  try {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    const adapter = new PrismaLibSql(libsql);
    const prisma = new PrismaClient({ adapter });
    
    const count = await prisma.playerRanking.count();
    return NextResponse.json({ ok: true, count, keys: Object.keys(prisma).filter(k => !k.startsWith('_')).join(',') });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, name: e.name, stack: e.stack?.substring(0, 500) }, { status: 500 });
  }
}