import { cookies } from "next/headers";
import { signSession, verifySession, type Role, type SessionPayload } from "./auth";

const COOKIE_NAME = "ss_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function setSessionCookie(payload: {
  userId: string;
  username: string;
  role: Role;
}): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
