"use client"

import { useEffect, useState } from "react"

type MediaItem = {
  id: string
  type: string
  url: string
  caption: string | null
  createdAt: string
  uploadedBy: { username: string }
}

export default function ManagerMediaPage() {
  const [club, setClub] = useState<{ id: string; name: string } | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadType, setUploadType] = useState("GALLERY")
  const [url, setUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const myClub = (data.clubs ?? []).find((c: Record<string, unknown>) => c.manager)
        if (myClub) {
          setClub(myClub)
          return fetch(`/api/media?clubId=${myClub.id}`)
            .then((r2) => r2.json())
            .then((d) => setMedia(d.media ?? []))
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!club || !url) return

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId: club.id, type: uploadType, url, caption: caption || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Upload failed")
        return
      }

      const data = await res.json()
      setMedia((prev) => [data.media, ...prev])
      setUrl("")
      setCaption("")
    } catch {
      setError("Upload failed")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" })
      if (res.ok) setMedia((prev) => prev.filter((m) => m.id !== id))
    } catch {}
  }

  if (loading) return <p className="text-white/40 p-8">Loading...</p>
  if (!club) return <p className="text-red-400 p-8">No club found.</p>

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <h1 className="bc-headline text-3xl text-white">Media: {club.name}</h1>

        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Add Media</h2>
          {error && <div className="mb-3 rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {["LOGO", "BANNER", "POST", "GALLERY"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setUploadType(t)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition ${uploadType === t ? "bg-[#00ff85] text-[#050505]" : "border border-[#1a1a1a] bg-[#111] text-white/50"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Image URL (https://...)"
              required
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none"
            />
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              maxLength={200}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none"
            />
            <button type="submit" className="h-10 px-6 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] uppercase hover:bg-white transition">
              Add
            </button>
          </form>
        </div>

        {media.length === 0 ? (
          <p className="text-white/40">No media yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {media.map((m) => (
              <div key={m.id} className="group relative rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
                <img src={m.url} alt={m.caption ?? ""} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-2">
                  <p className="text-white text-xs text-center">{m.caption || m.type}</p>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
