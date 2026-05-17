import { NextResponse } from "next/server";
import { requireRole } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    message: `pong from admin ${auth.session.username}`,
  });
}
