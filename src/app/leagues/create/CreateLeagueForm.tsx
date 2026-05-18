"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export default function CreateLeagueForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("Zimbabwe");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [format, setFormat] = useState("ROUND_ROBIN");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [joinPolicy, setJoinPolicy] = useState("INVITE");
  const [joinPassword, setJoinPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug: effectiveSlug,
        description: description || undefined,
        region,
        visibility,
        format,
        maxPlayers,
        joinPolicy,
        joinPassword: joinPolicy === "PASSWORD" ? joinPassword : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create league");
      setBusy(false);
      return;
    }
    router.push(`/leagues/${data.league.slug}/manage`);
  }

  return (
    <form onSubmit={submit} className="frosted-card-sm p-5 space-y-4">
      <Field label="League name">
        <input
          type="text"
          required
          minLength={3}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ZimFCPro Premier League"
          className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
        />
      </Field>

      <Field label="URL slug" hint="Used in the link: /leagues/your-slug">
        <input
          type="text"
          required
          pattern="[a-z0-9\-]+"
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="zimfcpro-premier"
          className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
        />
      </Field>

      <Field label="Description" optional>
        <textarea
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Top tier weekly league. Sundays 8pm."
          className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Region">
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
          />
        </Field>
        <Field label="Visibility">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
          >
            <option value="PUBLIC">Public</option>
            <option value="UNLISTED">Unlisted</option>
            <option value="PRIVATE">Private</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Format">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
          >
            <option value="ROUND_ROBIN">Round Robin (single)</option>
            <option value="DOUBLE_RR">Round Robin (home + away)</option>
          </select>
        </Field>
        <Field label="Max players">
          <input
            type="number"
            min={2}
            max={64}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
          />
        </Field>
      </div>

      <Field label="Join policy">
        <select
          value={joinPolicy}
          onChange={(e) => setJoinPolicy(e.target.value)}
          className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
        >
          <option value="INVITE">Invite code required</option>
          <option value="OPEN">Open to anyone</option>
          <option value="PASSWORD">Shared password</option>
          <option value="APPROVAL">Request approval</option>
        </select>
      </Field>

      {joinPolicy === "PASSWORD" && (
        <Field label="Password">
          <input
            type="text"
            required
            minLength={3}
            maxLength={64}
            value={joinPassword}
            onChange={(e) => setJoinPassword(e.target.value)}
            className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted-faint focus:outline-none focus:border-accent/50"
          />
        </Field>
      )}

      {error && (
        <div className="rounded border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-mono text-accent">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create League"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-soft mb-1">
        {label} {optional && <span className="opacity-60">(optional)</span>}
      </span>
      {children}
      {hint && <span className="block mt-1 text-[10px] text-muted-soft">{hint}</span>}
    </label>
  );
}
