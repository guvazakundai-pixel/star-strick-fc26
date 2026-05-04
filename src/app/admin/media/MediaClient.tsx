"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MediaItem = {
  id: string;
  type: "LOGO" | "BANNER" | "POST" | "GALLERY";
  url: string;
  caption: string | null;
  createdAt: string;
};

const TYPES: MediaItem["type"][] = ["POST", "GALLERY", "LOGO", "BANNER"];

export function MediaClient({ clubId, initial }: { clubId: string; initial: MediaItem[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/clubs/${clubId}/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((m) => m.filter((x) => x.id !== id));
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="rounded bg-[var(--bc-accent)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black"
        >
          Upload media
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--bc-border)] px-4 py-12 text-center text-sm text-[var(--bc-text-soft)]">
          No media yet. Click <strong>Upload media</strong> to add a logo, banner, or gallery image.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((m) => (
            <article
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--bc-border)] bg-black"
            >
              <img
                src={m.url}
                alt={m.caption || m.type}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute top-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-white">
                {m.type}
              </span>
              <button
                onClick={() => remove(m.id)}
                className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-red-300 opacity-0 transition-opacity group-hover:opacity-100"
              >
                Delete
              </button>
              {m.caption && (
                <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent px-2 py-2 text-xs text-white line-clamp-2">
                  {m.caption}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {open && (
        <UploadModal
          clubId={clubId}
          onClose={() => setOpen(false)}
          onCreated={(m) => {
            setItems((prev) => [m, ...prev]);
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function UploadModal({
  clubId,
  onClose,
  onCreated,
}: {
  clubId: string;
  onClose: () => void;
  onCreated: (m: MediaItem) => void;
}) {
  const [type, setType] = useState<MediaItem["type"]>("POST");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/clubs/${clubId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, url, caption: caption || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Upload failed");
      return;
    }
    const { media } = await res.json();
    onCreated(media);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-xl border border-[var(--bc-border)] bg-[var(--bc-surface)] p-5"
      >
        <h2 className="bc-headline text-xl text-white">Upload media</h2>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[var(--bc-text-soft)] mb-1">
            Type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MediaItem["type"])}
            className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[var(--bc-text-soft)] mb-1">
            Image URL
          </span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            type="url"
            placeholder="https://…"
            className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--bc-accent)]"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[var(--bc-text-soft)] mb-1">
            Caption (optional)
          </span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="w-full rounded border border-[var(--bc-border)] bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--bc-accent)]"
          />
        </label>
        {error && (
          <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/80"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            type="submit"
            className="rounded bg-[var(--bc-accent)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
