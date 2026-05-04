"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  role: "PLAYER" | "CO_MANAGER";
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    country: string | null;
    platform: string | null;
    stats: { points: number; wins: number; losses: number; winStreak: number } | null;
  };
};

type Action = "APPROVE" | "REJECT" | "PROMOTE" | "DEMOTE";

export function MembersClient({
  clubId,
  initialMembers,
}: {
  clubId: string;
  initialMembers: Member[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const pending = members.filter((m) => m.status === "PENDING");
  const approved = members.filter((m) => m.status === "APPROVED");
  const rejected = members.filter((m) => m.status === "REJECTED");

  async function act(memberId: string, action: Action) {
    setBusyId(memberId);
    setError(null);
    const res = await fetch(`/api/clubs/${clubId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Action failed");
      return;
    }
    const { member } = await res.json();
    setMembers((m) => m.map((x) => (x.id === memberId ? { ...x, ...member } : x)));
    startTransition(() => router.refresh());
  }

  async function remove(memberId: string) {
    if (!confirm("Remove this member from the club?")) return;
    setBusyId(memberId);
    const res = await fetch(`/api/clubs/${clubId}/members/${memberId}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Remove failed");
      return;
    }
    setMembers((m) => m.filter((x) => x.id !== memberId));
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Section title="Pending requests" count={pending.length} accent>
        {pending.length === 0 ? (
          <Empty>No pending join requests.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map((m) => (
              <MemberCard key={m.id} member={m} busy={busyId === m.id}>
                <button
                  onClick={() => act(m.id, "APPROVE")}
                  className="rounded bg-[var(--bc-accent)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black"
                >
                  Approve
                </button>
                <button
                  onClick={() => act(m.id, "REJECT")}
                  className="rounded border border-red-500/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/10"
                >
                  Reject
                </button>
              </MemberCard>
            ))}
          </div>
        )}
      </Section>

      <Section title="Roster" count={approved.length}>
        {approved.length === 0 ? (
          <Empty>No approved members yet.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {approved.map((m) => (
              <MemberCard key={m.id} member={m} busy={busyId === m.id}>
                {m.role === "PLAYER" ? (
                  <button
                    onClick={() => act(m.id, "PROMOTE")}
                    className="rounded border border-[var(--bc-accent)]/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--bc-accent)] hover:bg-[var(--bc-accent)]/10"
                  >
                    Promote to co-manager
                  </button>
                ) : (
                  <button
                    onClick={() => act(m.id, "DEMOTE")}
                    className="rounded border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/5"
                  >
                    Demote to player
                  </button>
                )}
                <button
                  onClick={() => remove(m.id)}
                  className="rounded border border-red-500/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/10"
                >
                  Remove
                </button>
              </MemberCard>
            ))}
          </div>
        )}
      </Section>

      {rejected.length > 0 && (
        <Section title="Rejected" count={rejected.length}>
          <div className="grid gap-3 md:grid-cols-2 opacity-60">
            {rejected.map((m) => (
              <MemberCard key={m.id} member={m} busy={false}>
                <span className="font-mono text-[11px] uppercase text-[var(--bc-text-soft)]">
                  rejected
                </span>
              </MemberCard>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="bc-headline text-xl text-white">{title}</h2>
        <span
          className={
            "font-mono text-[11px] " +
            (accent && count > 0 ? "text-[var(--bc-accent)]" : "text-[var(--bc-text-soft)]")
          }
        >
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function MemberCard({
  member,
  busy,
  children,
}: {
  member: Member;
  busy: boolean;
  children: React.ReactNode;
}) {
  const u = member.user;
  return (
    <article
      className={
        "rounded-lg border border-[var(--bc-border)] bg-[var(--bc-surface)]/50 p-4 transition-opacity " +
        (busy ? "opacity-50" : "")
      }
    >
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 rounded-full bg-cover bg-center bg-black border border-[var(--bc-border)]"
          style={{ backgroundImage: u.avatarUrl ? `url(${u.avatarUrl})` : undefined }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white truncate">{u.displayName ?? u.username}</p>
          <p className="font-mono text-[11px] text-[var(--bc-text-soft)] truncate">
            @{u.username} · {u.country ?? "—"} · {u.platform ?? "—"}
          </p>
        </div>
        {member.role === "CO_MANAGER" && (
          <span className="rounded bg-[var(--bc-accent)]/15 border border-[var(--bc-accent)]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--bc-accent)]">
            Co-manager
          </span>
        )}
      </div>
      {u.stats && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Pts" value={u.stats.points} />
          <Stat label="W-L" value={`${u.stats.wins}-${u.stats.losses}`} />
          <Stat label="Streak" value={u.stats.winStreak} />
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-[var(--bc-border)] py-1">
      <p className="font-mono text-[10px] uppercase text-[var(--bc-text-soft)]">{label}</p>
      <p className="bc-headline text-base text-white">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--bc-border)] px-4 py-8 text-center text-sm text-[var(--bc-text-soft)]">
      {children}
    </div>
  );
}
