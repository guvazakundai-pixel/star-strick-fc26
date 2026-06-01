import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { rejectResult } from "@/lib/challenge-service";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }
  if (!body.reason || typeof body.reason !== "string") {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  try {
    const result = await rejectResult(body.code, auth.session.userId, body.reason);

    // If AI didn't resolve, try running AI again explicitly for debugging
    if (result.status === "DISPUTED" && !(result as any).aiResolved) {
      try {
        const { resolveDispute, applyAiVerdict } = await import("@/lib/ai-dispute-resolver");
        const { db } = await import("@/lib/db");

        const challenge = await db.execute({
          sql: "SELECT * FROM challenges WHERE challenge_code = ?",
          args: [body.code],
        });
        const ch = challenge.rows[0] as Record<string, unknown> | undefined;
        if (ch) {
          const mr = await db.execute({
            sql: "SELECT * FROM match_results WHERE challenge_id = ?",
            args: [ch.id as string],
          });
          const matchResult = mr.rows[0] as Record<string, unknown> | undefined;
          if (matchResult) {
            const aiVerdict = await resolveDispute(
              ch.id as string, body.code,
              ch.challenger_id as string, ch.opponent_id as string,
              {
                submittedBy: matchResult.submitted_by as string,
                challengerScore: Number(matchResult.challenger_score),
                opponentScore: Number(matchResult.opponent_score),
                screenshotUrl: matchResult.screenshot_url as string | null,
                notes: matchResult.notes as string | null,
                submittedAt: matchResult.submitted_at as string,
              },
              null,
              body.reason,
              "reject",
            );

            if (aiVerdict.autoApplied) {
              await applyAiVerdict(ch.id as string, body.code, aiVerdict, ch.challenger_id as string, ch.opponent_id as string);
              return NextResponse.json({
                ...result,
                aiRetry: "success",
                aiDecision: aiVerdict.decision,
                aiConfidence: aiVerdict.confidence,
                aiReasoning: aiVerdict.reasoning,
              });
            } else {
              return NextResponse.json({
                ...result,
                aiRetry: "escalated",
                aiReasoning: aiVerdict.reasoning,
              });
            }
          }
        }
      } catch (aiErr: any) {
        return NextResponse.json({
          ...result,
          aiError: aiErr.message,
          aiStack: aiErr.stack?.split("\n").slice(0, 3).join(" | "),
        });
      }
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
