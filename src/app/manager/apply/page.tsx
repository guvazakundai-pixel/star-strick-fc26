"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ManagerApplyPage() {
  const router = useRouter()
  const [clubName, setClubName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/manager/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubNameRequested: clubName, description }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Application failed")
        return
      }

      setSuccess(true)
    } catch {
      setError("Failed to submit application")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
          <h1 className="bc-headline text-3xl text-[#00ff85] mb-4">Application Sent!</h1>
          <p className="text-white/50 text-sm mb-6">
            Your application to manage <strong className="text-white">{clubName}</strong> is under review.
            An admin will approve or reject it soon.
          </p>
          <a
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8">
        <h1 className="bc-headline text-3xl text-white mb-2">Apply for Manager</h1>
        <p className="text-white/50 text-sm mb-6">Submit your application to manage a club</p>

        {error && (
          <div className="mb-4 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clubName" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
              Desired Club Name
            </label>
            <input
              id="clubName"
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none"
              placeholder="e.g. Game Nation"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
              Why do you want to manage this club?
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={20}
              maxLength={500}
              rows={4}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none resize-none"
              placeholder="Tell us about your vision..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] uppercase hover:bg-white transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>

        <a href="/dashboard" className="mt-6 block text-center text-sm text-white/50 hover:text-white transition">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  )
}
