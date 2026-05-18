"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Season = { id: string; seasonNumber: number; name: string; phase: string; _count: { fixtures: number } };
type Member = { id: string; username: string; displayName: string | null; joinedAt: string };
type Invite = { id: string; code: string; uses: number; maxUses: number | null; expiresAt: string | null; disabled: boolean };
type PendingFixture = {
  id: string;
  matchday: number;
  home: string;
  away: string;
  status: string;
  submittedHomeScore: number | null;
  submittedAwayScore: number | null;
  disputedHomeScore: number | null;
  disputedAwayScore: number | null;
  submittedBy: string | null;
};

export default function ManagePanel({
  slug,
  currentSeason,
  memberCount,
  members,
  invites,
  pendingFixtures,
}: {
  slug: string;
  currentSeason: Season | null;
  memberCount: number;
  members: Member[];
  invites: Invite[];
  pendingFixtures: PendingFixture[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function startSeason() {
    if (memberCount < 2) {
      setError("Need at least 2 members to start a season");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/leagues/${slug}/seasons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to start season");
      setBusy(false);
      return;
    }
    setInfo(`Season ${data.seasonNumber} started · ${data.fixtureCount} fixtures generated`);
    setBusy(false);
    router.refresh();
  }

  async function createInvite() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/leagues/${slug}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInHours: 24 * 30 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create invite");
      setBusy(false);
      return;
    }
    setInfo(`Invite created: ${data.invite.code}`);
    setBusy(false);
    router.refresh();
  }

  async function toggleInvite(id: string, disabled: boolean) {
    await fetch(`/api/leagues/${slug}/invites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled }),
    });
    router.refresh();
  }

  async function authenticate(id: string, decision: "APPROVE" | "VOID", scores?: { home: number; away: number }) {
    setBusy(true);
    setError(null);
    const body: Record<string, unknown> = { decision };
    if (scores) {
      body.decision = "OVERRIDE";
      body.homeScore = scores.home;
      body.awayScore = scores.away;
    }
    const res = await fetch(`/api/fixtures/${id}/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to authenticate");
      setBusy(false);
      return;
    }
    setInfo("Result authenticated");
    setBusy(false);
    router.refresh();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setInfo(`Copied: ${text}`);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-mono text-accent">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded border border-emerald/30 bg-emerald/10 px-3 py-2 text-xs font-mono text-emerald">
          {info}
        </div>
      )}

      <section className="frosted-card-sm p-4">
        <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">Season</h2>
        {currentSeason ? (
          <div className="space-y-1">
            <p className="text-ink">{currentSeason.name}</p>
            <p className="text-xs text-muted-soft font-mono uppercase">
              Phase: {currentSeason.phase} · {currentSeason._count.fixtures} fixtures
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-soft mb-3">No season started yet.</p>
            <button
              onClick={startSeason}
              disabled={busy || memberCount < 2}
              className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Starting…" : `Start Season 1 (${memberCount} members)`}
            </button>
          </div>
        )}
      </section>

      <section className="frosted-card-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink">Invites</h2>
          <button
            onClick={createInvite}
            disabled={busy}
            className="rounded-full bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-bg hover:opacity-90 disabled:opacity-50"
          >
            + New code
          </button>
        </div>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-soft">No invite codes yet</p>
        ) : (
          <div className="space-y-2">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between border border-border/60 rounded-sm px-3 py-2">
                <div>
                  <button
                    onClick={() => copy(i.code)}
                    className="font-mono text-ink hover:text-accent transition-colors"
                  >
                    {i.code}
                  </button>
                  <p className="text-[10px] text-muted-soft font-mono mt-0.5">
                    {i.uses} use{i.uses !== 1 ? "s" : ""}{i.maxUses ? ` / ${i.maxUses} max` : ""}
                    {i.expiresAt ? ` · expires ${new Date(i.expiresAt).toLocaleDateString()}` : ""}
                    {i.disabled ? " · DISABLED" : ""}
                  </p>
                </div>
                <button
                  onClick={() => toggleInvite(i.id, !i.disabled)}
                  className="text-[10px] font-mono uppercase text-muted-soft hover:text-ink"
                >
                  {i.disabled ? "Enable" : "Disable"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="frosted-card-sm p-4">
        <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
          Members ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-soft">No members yet. Share an invite code to get started.</p>
        ) : (
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.id} className="text-sm text-ink font-mono">
                @{m.username}
                <span className="text-muted-soft text-[10px] ml-2">
                  joined {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="frosted-card-sm p-4">
        <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
          Pending authentication ({pendingFixtures.length})
        </h2>
        {pendingFixtures.length === 0 ? (
          <p className="text-sm text-muted-soft">Nothing waiting for you.</p>
        ) : (
          <div className="space-y-2">
            {pendingFixtures.map((f) => (
              <div key={f.id} className="border border-border/60 rounded-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-ink text-sm">
                    MD {f.matchday}: @{f.home} vs @{f.away}
                  </span>
                  <span className="font-mono text-[10px] text-muted-soft uppercase">{f.status}</span>
                </div>
                <div className="text-xs font-mono text-muted-soft mb-2">
                  Submitted by @{f.submittedBy ?? "?"}: <span className="text-ink">{f.submittedHomeScore}-{f.submittedAwayScore}</span>
                  {f.status === "DISPUTED" && f.disputedHomeScore !== null && (
                    <>
                      {" · "}Disputed: <span className="text-accent">{f.disputedHomeScore}-{f.disputedAwayScore}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => authenticate(f.id, "APPROVE")}
                    disabled={busy || f.submittedHomeScore === null}
                    className="rounded-full bg-emerald/15 border border-emerald/30 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald hover:bg-emerald/25 disabled:opacity-40"
                  >
                    Approve {f.submittedHomeScore}-{f.submittedAwayScore}
                  </button>
                  {f.status === "DISPUTED" && f.disputedHomeScore !== null && (
                    <button
                      onClick={() => authenticate(f.id, "APPROVE", { home: f.disputedHomeScore!, away: f.disputedAwayScore! })}
                      disabled={busy}
                      className="rounded-full bg-cyan/15 border border-cyan/30 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan hover:bg-cyan/25 disabled:opacity-40"
                    >
                      Approve {f.disputedHomeScore}-{f.disputedAwayScore}
                    </button>
                  )}
                  <button
                    onClick={() => authenticate(f.id, "VOID")}
                    disabled={busy}
                    className="rounded-full bg-surface-2 border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-soft hover:text-ink disabled:opacity-40"
                  >
                    Void
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
