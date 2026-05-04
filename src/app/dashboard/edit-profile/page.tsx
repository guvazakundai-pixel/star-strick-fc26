"use client";

import { useState, useTransition } from "react";
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

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("Zimbabwe");
  const [platform, setPlatform] = useState("CROSSPLAY");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const res = await fetch("/api/auth/me", { method: "GET" });
    if (!res.ok) {
      setError("Not logged in");
      return;
    }
    const { user } = await res.json();
    setDisplayName(user.displayName || "");
    setBio(user.bio || "");
    setCountry(user.country || "Zimbabwe");
    setPlatform(user.platform || "CROSSPLAY");

    const updateRes = await fetch("/api/auth/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, country, platform }),
    });
    if (!updateRes.ok) {
      const j = await updateRes.json().catch(() => ({}));
      setError(j.error || "Update failed");
      return;
    }
    setSuccess(true);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-xl px-4 py-6">
        <button
          onClick={() => router.back()}
          className="font-mono text-[11px] uppercase tracking-wider text-[#9a9a9a] hover:text-white mb-4 inline-block"
        >
          ← Back to Dashboard
        </button>
        <h1 className="bc-headline text-3xl text-white mb-6">Edit Profile</h1>

        {error && (
          <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded border border-[#00ff85]/40 bg-[#00ff85]/10 px-3 py-2 text-sm text-[#00ff85] mb-4">
            Profile updated!
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-[#9a9a9a] mb-1">
              Display Name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              minLength={3}
              maxLength={30}
              required
              className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-[#9a9a9a] mb-1">
              EA FC Username <span className="text-[#666]">(cannot be changed)</span>
            </span>
            <input
              disabled
              value="Loaded from profile"
              className="w-full rounded border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-[#666] text-sm cursor-not-allowed"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-[#9a9a9a] mb-1">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm resize-none"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-[#9a9a9a] mb-1">
              Country
            </span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-[#9a9a9a] mb-1">
              Platform
            </span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-[#00ff85] py-2.5 font-bold uppercase tracking-wider text-[#050505] hover:bg-white transition disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}