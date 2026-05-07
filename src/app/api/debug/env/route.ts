import { NextResponse } from "next/server";

export async function GET() {
  const hasTursoUrl = !!process.env.TURSO_DATABASE_URL;
  const hasTursoToken = !!process.env.TURSO_AUTH_TOKEN;
  const hasDbUrl = !!process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV;

  return NextResponse.json({
    env: { hasTursoUrl, hasTursoToken, hasDbUrl, nodeEnv },
    tursoUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 30),
  });
}