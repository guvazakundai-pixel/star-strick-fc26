"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ZIMBABWE_CITIES = [
  "Harare", "Bulawayo", "Mutare", "Gweru", "Chitungwiza",
  "Victoria Falls", "Masvingo", "Kadoma", "Chinhoyi", "Marondera",
]

export default function CreateClubPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [city, setCity] = useState("Harare")
  const [description, setDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          description,
          ...(logoUrl && { logoUrl }),
          ...(bannerUrl && { bannerUrl }),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to create club")
        return
      }

      const data = await res.json()
      router.push(`/clubs/${data.club.slug}`)
    } catch {
      setError("Failed to create club")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8">
        <h1 className="bc-headline text-3xl text-white mb-2">Create Club</h1>
        <p className="text-white/50 text-sm mb-6">Set up your esports club</p>

        {error && (
          <div className="mb-4 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
              Club Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none"
              placeholder="e.g. Game Nation"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
              City
            </label>
            <select
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white focus:border-[#00ff85] focus:outline-none"
            >
              {ZIMBABWE_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none resize-none"
              placeholder="Tell the world about your club..."
            />
          </div>

          <div>
            <label htmlFor="logoUrl" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
              Logo URL (optional)
            </label>
            <input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <div>
            <label htmlFor="bannerUrl" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
              Banner URL (optional)
            </label>
            <input
              id="bannerUrl"
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] uppercase hover:bg-white transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Club"}
          </button>
        </form>

        <a href="/dashboard" className="mt-6 block text-center text-sm text-white/50 hover:text-white transition">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  )
}
