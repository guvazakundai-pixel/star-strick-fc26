"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleNext = () => {
    if (step === 1 && username.length >= 3) {
      setStep(2)
    } else if (step === 2 && email.includes("@")) {
      setStep(3)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(username, email, password, phone || undefined)
      router.push("/onboarding")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-[0.1em]">STAR STRICK</h1>
          <p className="text-[#00ff85] text-sm font-bold mt-1">Start Your Rise</p>
        </div>

        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-6">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition ${
                  s <= step ? "bg-[#00ff85]" : "bg-[#1a1a1a]"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                  Gamer Tag
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  required
                  minLength={3}
                  maxLength={30}
                  className="w-full h-12 rounded-sm border border-[#1a1a1a] bg-[#111] px-4 text-lg text-white placeholder-white/20 focus:border-[#00ff85] focus:outline-none"
                  placeholder="YourName"
                  autoFocus
                />
                <p className="text-xs text-white/30 mt-2">3-30 characters, letters, numbers, underscores</p>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={username.length < 3}
                  className="w-full h-12 mt-4 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  NEXT →
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 rounded-sm border border-[#1a1a1a] bg-[#111] px-4 text-lg text-white placeholder-white/20 focus:border-[#00ff85] focus:outline-none"
                  placeholder="you@example.com"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!email.includes("@")}
                  className="w-full h-12 mt-4 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  NEXT →
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 rounded-sm border border-[#1a1a1a] bg-[#111] px-4 text-white placeholder-white/20 focus:border-[#00ff85] focus:outline-none"
                    placeholder="+263 77 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full h-12 rounded-sm border border-[#1a1a1a] bg-[#111] px-4 text-white placeholder-white/20 focus:border-[#00ff85] focus:outline-none"
                    placeholder="••••••••"
                    autoFocus
                  />
                  <p className="text-xs text-white/30 mt-1">Minimum 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || password.length < 6}
                  className="w-full h-12 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "START YOUR RISE →"}
                </button>
              </motion.div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{" "}
            <a href="/login" className="text-[#00ff85] hover:underline font-bold">
              Sign in
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
