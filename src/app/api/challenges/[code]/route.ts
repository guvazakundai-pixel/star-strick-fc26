import { NextResponse } from "next/server";
import { getChallengeByCode } from "@/lib/challenge-service";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const challenge = await getChallengeByCode(code);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }
  return NextResponse.json({ challenge });
}