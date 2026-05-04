"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Form = {
  name: string;
  tag: string;
  city: string;
  description: string;
  isInviteOnly: boolean;
  logoUrl: string;
  bannerUrl: string;
};

export function SettingsClient({
  clubId,
  initial,
}: {
  clubId: string;
  initial: Form;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    const body = {
      name: form.name,
      tag: form.tag || undefined,
      city: form.city,
      description: form.description || undefined,
      isInviteOnly: form.isInviteOnly,
      logoUrl: form.logoUrl || undefined,
      bannerUrl: form.bannerUrl || undefined,
    };
    const res = await fetch(`/api/clubs/${clubId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Save failed");
      return;
    }
    setMsg("Saved.");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-[var(--bc-border)] bg-[var(--bc-surface)]/50 p-5"
    >
      <Field label="Club name">
        <input
          required
          minLength={2}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--bc-accent)]"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tag (2-5 chars, uppercase)">
          <input
            value={form.tag}
            maxLength={5}
            onChange={(e) => update("tag", e.target.value.toUpperCase())}
            className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--bc-accent)]"
          />
        </Field>
        <Field label="City">
          <input
            required
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--bc-accent)]"
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--bc-accent)]"
        />
      </Field>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isInviteOnly}
          onChange={(e) => update("isInviteOnly", e.target.checked)}
          className="h-4 w-4 rounded accent-[var(--bc-accent)]"
        />
        <span className="text-sm text-white">Invite-only club</span>
      </label>
      <Field label="Logo URL">
        <input
          type="url"
          value={form.logoUrl}
          onChange={(e) => update("logoUrl", e.target.value)}
          className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--bc-accent)]"
        />
      </Field>
      <Field label="Banner URL">
        <input
          type="url"
          value={form.bannerUrl}
          onChange={(e) => update("bannerUrl", e.target.value)}
          className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--bc-accent)]"
        />
      </Field>

      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {msg && (
        <p className="rounded border border-[var(--bc-accent)]/40 bg-[var(--bc-accent)]/10 px-3 py-2 text-sm text-[var(--bc-accent)]">
          {msg}
        </p>
      )}

      <div className="flex justify-end">
        <button
          disabled={busy}
          type="submit"
          className="rounded bg-[var(--bc-accent)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-[var(--bc-text-soft)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}