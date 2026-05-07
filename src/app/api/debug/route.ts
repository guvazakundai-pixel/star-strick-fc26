import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    const { createClient } = await import("@libsql/client");
    
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    
    const adapter = new PrismaLibSql(libsql);
    const prisma = new PrismaClient({ adapter });
    
    const count = await prisma.playerRanking.count();
    
    return NextResponse.json({ ok: true, count, tursoUrl: process.env.TURSO_DATABASE_URL?.substring(0, 40) });
  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message, 
      name: e.name,
      stack: e.stack?.substring(0, 800),
      tursoUrl: process.env.TURSO_DATABASE_URL?.substring(0, 40),
      tursoToken: !!process.env.TURSO_AUTH_TOKEN,
    }, { status: 500 });
  }
}