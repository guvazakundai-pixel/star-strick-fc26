import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export interface ChallengeToken {
  token: string;
  challengerId: string;
  opponentId: string | null;
  matchType: string;
  platform: string;
  region: string;
  wagerAmount: number;
  expiresAt: string;
  used: boolean;
}

function generateToken(): string {
  return randomBytes(24).toString("base64url").slice(0, 16);
}

export async function createChallengeToken(data: {
  challengerId: string;
  opponentId: string | null;
  matchType: string;
  platform: string;
  region: string;
  wagerAmount: number;
}): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await db.execute({
    sql: `INSERT INTO challenge_tokens (token, challenger_id, opponent_id, match_type, platform, region, wager_amount, expires_at, used)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [
      token,
      data.challengerId,
      data.opponentId ?? null,
      data.matchType,
      data.platform,
      data.region,
      data.wagerAmount,
      expiresAt,
    ],
  });

  return token;
}

export async function getChallengeToken(token: string): Promise<ChallengeToken | null> {
  const res = await db.execute({
    sql: "SELECT * FROM challenge_tokens WHERE token = ?",
    args: [token],
  });
  const row = res.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    token: row.token as string,
    challengerId: row.challenger_id as string,
    opponentId: (row.opponent_id as string) ?? null,
    matchType: row.match_type as string,
    platform: row.platform as string,
    region: row.region as string,
    wagerAmount: Number(row.wager_amount ?? 0),
    expiresAt: row.expires_at as string,
    used: Boolean(row.used),
  };
}

export async function markTokenUsed(token: string): Promise<void> {
  await db.execute({
    sql: "UPDATE challenge_tokens SET used = 1 WHERE token = ?",
    args: [token],
  });
}

export function shareUrls(token: string): {
  app: string;
  shareUrl: string;
}[] {
  const base = "https://zimfcpro.vercel.app/match/claim";
  const url = `${base}/${token}`;
  const text = `⚡ ${token.slice(0, 6).toUpperCase()} is challenging you on ZIM FCPRO! Accept the battle: ${url}`;

  return [
    { app: "Copy Link", shareUrl: url },
    { app: "WhatsApp", shareUrl: `https://wa.me/?text=${encodeURIComponent(text)}` },
    { app: "Telegram", shareUrl: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { app: "Discord", shareUrl: text },
  ];
}
