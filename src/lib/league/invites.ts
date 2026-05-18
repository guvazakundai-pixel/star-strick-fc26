const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit 0/O/1/I

export function generateInviteCode(prefix?: string): string {
  let body = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  const tail = `${body.slice(0, 4)}-${body.slice(4, 8)}`;
  return prefix ? `${prefix.toUpperCase()}-${tail}` : tail;
}

export type InviteValidation =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "DISABLED" | "EXPIRED" | "EXHAUSTED" };

export function validateInvite(invite: {
  disabled: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  uses: number;
} | null): InviteValidation {
  if (!invite) return { ok: false, reason: "NOT_FOUND" };
  if (invite.disabled) return { ok: false, reason: "DISABLED" };
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "EXPIRED" };
  }
  if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
    return { ok: false, reason: "EXHAUSTED" };
  }
  return { ok: true };
}
