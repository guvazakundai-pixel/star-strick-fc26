import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { submitScore } from "@/lib/match-engine/service";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const MULTIPART_EXPECTED_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { matchId } = await params;

  const rl = rateLimit(rateLimitKey(req, "submit-score", auth.session.userId), { max: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
  }

  const match = await prisma.matchReport.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (match.player1Id !== auth.session.userId && match.player2Id !== auth.session.userId) {
    return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let body;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const score = formData.get("score");
    const opponentScore = formData.get("opponentScore");
    const rageQuit = formData.get("rageQuit") === "true";

    const screenshots: string[] = [];
    const files = formData.getAll("screenshots") as File[];
    for (const file of files.slice(0, 3)) {
      if (file.size > MULTIPART_EXPECTED_SIZE / 3) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const b64 = buffer.toString("base64");
      screenshots.push(`data:${file.type};base64,${b64}`);
    }

    body = {
      score: Number(score),
      opponentScore: Number(opponentScore),
      screenshots,
      rageQuit,
    };
  } else {
    body = await req.json().catch(() => null);
  }

  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { score, opponentScore, screenshots = [], videoUrl, rageQuit = false } = body;

  if (typeof score !== "number" || typeof opponentScore !== "number" || score < 0 || opponentScore < 0) {
    return NextResponse.json({ error: "Invalid score values" }, { status: 400 });
  }

  if (score > 50 || opponentScore > 50) {
    return NextResponse.json({ error: "Score cannot exceed 50" }, { status: 400 });
  }

  const { antiCheat } = await submitScore({
    matchId,
    playerId: auth.session.userId,
    score,
    opponentScore,
    screenshots,
    videoUrl,
    rageQuit,
    antiCheat: {
      ipHash: auth.session.userId,
      deviceHash: auth.session.userId,
      userAgent: req.headers.get("user-agent") ?? "",
      matchDuration: 0,
      scoreSpeed: 0,
      previousOpponents: [],
      timeSinceLastMatch: 0,
      flags: [],
    },
  });

  return NextResponse.json({
    submitted: true,
    status: "SCORE_SUBMITTED",
    message: "Score submitted. Waiting for opponent verification.",
    antiCheat: {
      passed: antiCheat.passed,
      flags: antiCheat.flags,
    },
  });
}
