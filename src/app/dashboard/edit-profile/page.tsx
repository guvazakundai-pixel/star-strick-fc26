"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

const PLATFORMS = [
  { value: "CROSSPLAY", label: "Crossplay" },
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox Series X|S" },
  { value: "PC", label: "PC (EA App)" },
] as const;

export default function EditProfilePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("Zimbabwe");
  const [platform, setPlatform] = useState("CROSSPLAY");
  const [username, setUsername] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const { user } = await res.json();
          setDisplayName(user.displayName || "");
          setUsername(user.username || "");
          setBio(user.bio || "");
          setCountry(user.country || "Zimbabwe");
          setPlatform(user.platform || "CROSSPLAY");
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const res = await fetch("/api/auth/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, country, platform }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Update failed");
      return;
    }
    setSuccess(true);
    startTransition(() => {
      router.refresh();
    });
  }

  if (loading) {
    return (
      <div className="broadcast-theme min-h-screen bc-noise">
        <div className="mx-auto max-w-xl px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-soft">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-xl px-4 py-6">
        <button
          onClick={() => router.back()}
          className="font-mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-ink transition-colors duration-200 mb-4 inline-block"
        >
          &larr; Back to Dashboard
        </button>
        <h1 className="bc-headline text-3xl text-ink mb-6">Edit Profile</h1>

        {error && (
          <div className="rounded-[12px] border border-negative/30 bg-negative/8 px-3 py-2 text-sm text-negative/90 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-[12px] border border-accent/30 bg-accent/8 px-3 py-2 text-sm text-accent mb-4">
            Profile updated!
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Display Name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              minLength={3}
              maxLength={30}
              required
              className="w-full apple-input px-3 py-2.5 text-ink text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              EA FC Username <span className="text-muted-faint">(cannot be changed)</span>
            </span>
            <input
              disabled
              value={username ? `@${username}` : ""}
              className="w-full rounded-[14px] border border-border-faint bg-bg-elevated/60 px-3 py-2.5 text-muted-faint text-sm cursor-not-allowed"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full apple-input px-3 py-2.5 text-ink text-sm resize-none"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Country
            </span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full apple-input px-3 py-2.5 text-ink text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1">
              Platform
            </span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-[14px] cta-primary py-2.5 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none"
          >
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}