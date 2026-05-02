"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ManagerEditPage() {
  const router = useRouter()
  const [club, setClub] = useState<{ id: string; name: string; city: string; description: string; logoUrl: string; bannerUrl: string } | null>(null)
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [description, setDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const myClub = (data.clubs ?? []).find((c: Record<string, unknown>) => c.manager)
        if (myClub) {
          const c = myClub as Record<string, string>
          setClub(myClub)
          setName(c.name ?? "")
          setCity(c.city ?? "")
          setDescription(c.description ?? "")
          setLogoUrl(c.logoUrl ?? "")
          setBannerUrl(c.bannerUrl ?? "")
        }
      })
      .catch(() => setError("Failed to load club"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    if (!club) return

    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, description, logoUrl, bannerUrl }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to update")
        return
      }

      router.push("/dashboard")
    } catch {
      setError("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-white/40 p-8">Loading...</p>
  if (!club) return <p className="text-red-400 p-8">No club found. Create one first.</p>

  return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8">
        <h1 className="bc-headline text-3xl text-white mb-2">Edit Club</h1>
        <p className="text-white/50 text-sm mb-6">Update your club details</p>

        {error && (
          <div className="mb-4 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white focus:border-[#00ff85] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white focus:border-[#00ff85] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white focus:border-[#00ff85] focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Logo URL</label>
            <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white focus:border-[#00ff85] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Banner URL</label>
            <input type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white focus:border-[#00ff85] focus:outline-none" />
          </div>
          <button type="submit" disabled={saving} className="w-full h-11 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] uppercase hover:bg-white transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
        <a href="/dashboard" className="mt-6 block text-center text-sm text-white/50 hover:text-white transition">← Back</a>
      </div>
    </div>
  )
}
