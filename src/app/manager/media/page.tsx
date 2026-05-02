"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"

type MediaItem = {
  id: string
  type: string
  url: string
  caption: string | null
  createdAt: string
  uploadedBy: { username: string }
}

export default function ManagerMediaPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [club, setClub] = useState<{ id: string; name: string } | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadType, setUploadType] = useState("GALLERY")
  const [caption, setCaption] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB")
      return
    }

    setError("")
    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!club || !selectedFile) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("type", uploadType)
      formData.append("clubId", club.id)
      if (caption) formData.append("caption", caption)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Upload failed")
        return
      }

      const data = await res.json()
      setMedia((prev) => [data.media, ...prev])
      setSelectedFile(null)
      setPreview(null)
      setCaption("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch {
      setError("Upload failed")
    } finally {
      setUploading(false)
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Upload Media</h2>
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

            <div
              className="border-2 border-dashed border-[#1a1a1a] rounded-sm p-6 text-center cursor-pointer hover:border-[#00ff85] transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-sm" />
              ) : (
                <div>
                  <p className="text-white/50 text-sm">Click to select image</p>
                  <p className="text-white/30 text-xs mt-1">JPEG, PNG, WebP · Max 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              maxLength={200}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none"
            />

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="h-10 px-6 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] uppercase hover:bg-white transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
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
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-sm bg-black/60 text-[10px] text-white/70 font-bold">
                  {m.type}
                </div>
                {m.caption && (
                  <p className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/70 text-xs text-white truncate">
                    {m.caption}
                  </p>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-sm text-red-400 hover:text-red-300 font-bold"
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
