import { NextResponse } from "next/server";
import { expireChallenges } from "@/lib/challenge-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await expireChallenges();
  return NextResponse.json({ ok: true, expired: result.expired });
}