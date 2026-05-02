"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

type Post = {
  id: string
  content: string
  imageUrl: string | null
  isAnnouncement: boolean
  createdAt: string
  club: { name: string; slug: string }
}

export default function ManagerPostsPage() {
  const { user } = useAuth()
  const [club, setClub] = useState<{ id: string; name: string } | null>(null)
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const myClub = (data.clubs ?? []).find((c: Record<string, unknown>) => c.manager)
        if (myClub) {
          setClub(myClub)
          return fetch(`/api/posts?clubId=${myClub.id}`)
            .then((r2) => r2.json())
            .then((d) => setPosts(d.posts ?? []))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!club || !content.trim()) return

    setPosting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: club.id,
          content,
          imageUrl: imageUrl || undefined,
          isAnnouncement,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? "Failed to post")
        return
      }

      const data = await res.json()
      setPosts((prev) => [data.post, ...prev])
      setContent("")
      setImageUrl("")
      setIsAnnouncement(false)
    } catch {
      alert("Failed to post")
    } finally {
      setPosting(false)
    }
  }

  if (loading) return <p className="text-white/40 p-8">Loading...</p>
  if (!club) return <p className="text-red-400 p-8">No club found.</p>

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="bc-headline text-3xl text-white">Club Feed</h1>

        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">New Post</h2>
          <form onSubmit={handlePost} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your club?"
              rows={3}
              maxLength={2000}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none resize-none"
            />
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#00ff85] focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  onChange={(e) => setIsAnnouncement(e.target.checked)}
                  className="rounded border-[#1a1a1a] bg-[#111] text-[#00ff85] focus:ring-0"
                />
                <span className="text-xs text-white/60">Post as Announcement</span>
              </label>
              <button
                type="submit"
                disabled={posting || !content.trim()}
                className="h-8 px-4 rounded-sm bg-[#00ff85] text-[#050505] font-bold text-xs hover:bg-white transition disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-white/40">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className={`rounded-sm border p-4 ${post.isAnnouncement ? "border-[#ffb800]/30 bg-[#ffb800]/5" : "border-[#1a1a1a] bg-[#0a0a0a]"}`}>
                {post.isAnnouncement && <span className="text-xs font-bold text-[#ffb800] uppercase tracking-wider">Announcement</span>}
                <p className="text-white mt-1 text-sm whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="" className="mt-3 rounded-sm max-h-64 object-cover" />
                )}
                <p className="text-xs text-white/30 mt-3">
                  {new Date(post.createdAt).toLocaleDateString()} · {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
