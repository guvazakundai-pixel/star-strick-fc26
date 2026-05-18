"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "SCHEDULED" | "SUBMITTED" | "CONFIRMED" | "AUTHENTICATED" | "DISPUTED" | "VOID";
type Role = "HOME" | "AWAY" | "OWNER" | "OTHER";

export default function FixturePanel({
  fixtureId,
  status,
  role,
  submittedById,
  submittedHomeScore,
  submittedAwayScore,
  submittedByUsername,
  confirmedByUsername,
  disputedHomeScore,
  disputedAwayScore,
  currentUserId,
  notes,
}: {
  fixtureId: string;
  status: Status;
  role: Role;
  submittedById: string | null;
  submittedHomeScore: number | null;
  submittedAwayScore: number | null;
  submittedByUsername: string | null;
  confirmedByUsername: string | null;
  disputedHomeScore: number | null;
  disputedAwayScore: number | null;
  currentUserId: string | null;
  notes: string | null;
}) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [noteInput, setNoteInput] = useState(notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    (role === "HOME" || role === "AWAY") &&
    (status === "SCHEDULED" || status === "SUBMITTED" || status === "DISPUTED");
  const isMySubmission = submittedById === currentUserId;
  const canConfirm =
    status === "SUBMITTED" && (role === "HOME" || role === "AWAY") && !isMySubmission;
  const canDispute =
    status === "SUBMITTED" && (role === "HOME" || role === "AWAY") && !isMySubmission;

  async function call(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/fixtures/${fixtureId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      setBusy(false);
      return false;
    }
    setBusy(false);
    router.refresh();
    return true;
  }

  if (status === "AUTHENTICATED" || status === "VOID") {
    return (
      <div className="frosted-card-sm p-4 text-center text-muted-soft text-sm">
        {notes && <p className="italic text-xs">{notes}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-mono text-accent">
          {error}
        </div>
      )}

      {status === "SUBMITTED" && (
        <div className="frosted-card-sm p-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mb-1">
            Submitted by @{submittedByUsername}
          </p>
          <p className="text-3xl font-display text-ink">
            {submittedHomeScore} <span className="text-muted-soft">-</span> {submittedAwayScore}
          </p>
          {canConfirm && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => call("confirm")}
                disabled={busy}
                className="flex-1 rounded-full bg-emerald/15 border border-emerald/30 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-emerald hover:bg-emerald/25 disabled:opacity-40"
              >
                Confirm
              </button>
            </div>
          )}
          {canDispute && (
            <>
              <p className="text-[10px] font-mono uppercase text-muted-soft mt-4 mb-2">
                Disagree? Submit your version:
              </p>
              <ScoreInput home={homeScore} away={awayScore} onHome={setHomeScore} onAway={setAwayScore} />
              <button
                onClick={() => call("dispute", { homeScore, awayScore })}
                disabled={busy}
                className="mt-2 w-full rounded-full bg-accent/15 border border-accent/30 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-accent hover:bg-accent/25 disabled:opacity-40"
              >
                Dispute
              </button>
            </>
          )}
        </div>
      )}

      {status === "CONFIRMED" && (
        <div className="frosted-card-sm p-4 text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-emerald">
            Confirmed by @{confirmedByUsername}
          </p>
          <p className="text-3xl font-display text-ink mt-1">
            {submittedHomeScore} <span className="text-muted-soft">-</span> {submittedAwayScore}
          </p>
          <p className="text-xs text-muted-soft mt-2">Awaiting league owner authentication.</p>
        </div>
      )}

      {status === "DISPUTED" && (
        <div className="frosted-card-sm p-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-accent mb-2">Disputed</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-[10px] font-mono uppercase text-muted-soft">@{submittedByUsername} says</p>
              <p className="text-2xl font-display text-ink">
                {submittedHomeScore}-{submittedAwayScore}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-muted-soft">Other says</p>
              <p className="text-2xl font-display text-accent">
                {disputedHomeScore}-{disputedAwayScore}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-soft mt-3 text-center">
            Awaiting owner decision.
          </p>
        </div>
      )}

      {canSubmit && status !== "SUBMITTED" && (
        <div className="frosted-card-sm p-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mb-2">
            Submit final score
          </p>
          <ScoreInput home={homeScore} away={awayScore} onHome={setHomeScore} onAway={setAwayScore} />
          <textarea
            rows={2}
            placeholder="Notes (optional)"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            maxLength={500}
            className="mt-2 w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={() => call("submit", { homeScore, awayScore, notes: noteInput || undefined })}
            disabled={busy}
            className="mt-2 w-full rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : "Submit score"}
          </button>
        </div>
      )}

      {role === "OTHER" && (
        <div className="frosted-card-sm p-4 text-center text-sm text-muted-soft">
          You're not playing this match. Only the two players or the league owner can act on it.
        </div>
      )}
    </div>
  );
}

function ScoreInput({
  home,
  away,
  onHome,
  onAway,
}: {
  home: number;
  away: number;
  onHome: (n: number) => void;
  onAway: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <input
        type="number"
        min={0}
        max={99}
        value={home}
        onChange={(e) => onHome(Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
        className="w-20 rounded-sm border border-border bg-surface-2 px-3 py-2 text-2xl font-display text-ink text-center focus:outline-none focus:border-accent/50"
      />
      <span className="text-muted-soft">-</span>
      <input
        type="number"
        min={0}
        max={99}
        value={away}
        onChange={(e) => onAway(Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
        className="w-20 rounded-sm border border-border bg-surface-2 px-3 py-2 text-2xl font-display text-ink text-center focus:outline-none focus:border-accent/50"
      />
    </div>
  );
}
