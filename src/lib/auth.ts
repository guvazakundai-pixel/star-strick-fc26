import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-only-secret-do-not-use-in-prod"
);
const ISSUER = "star-strick-fc26";
const AUDIENCE = "star-strick-fc26";
const TTL = "7d";

export type Role = "PLAYER" | "MANAGER" | "ADMIN";
export const ROLES = ["PLAYER", "MANAGER", "ADMIN"] as const satisfies readonly Role[];

export interface SessionPayload extends JWTPayload {
  userId: string;
  username: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(
  payload: Pick<SessionPayload, "userId" | "username" | "role">
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload;
  } catch {
    return null;
  }
}