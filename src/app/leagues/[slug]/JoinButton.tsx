"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinButton({
  slug,
  joinPolicy,
}: {
  slug: string;
  joinPolicy: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/leagues/${slug}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: joinPolicy === "INVITE" ? code.trim() : undefined,
        password: joinPolicy === "PASSWORD" ? password : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to join");
      setBusy(false);
      return;
    }
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  if (joinPolicy === "OPEN" || joinPolicy === "APPROVAL") {
    return (
      <button
        onClick={submit}
        disabled={busy}
        className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {busy ? "Joining…" : joinPolicy === "APPROVAL" ? "Request to join" : "Join"}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-90 transition-opacity"
        >
          Join
        </button>
      ) : (
        <div className="frosted-card-sm p-3 flex flex-col gap-2 w-72">
          {joinPolicy === "INVITE" && (
            <input
              type="text"
              placeholder="Invite code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
            />
          )}
          {joinPolicy === "PASSWORD" && (
            <input
              type="text"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
            />
          )}
          {error && (
            <div className="text-[11px] font-mono text-accent">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="flex-1 rounded-full bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-bg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "…" : "Confirm"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
