"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const FORMATS = [
  {
    id: "ROUND_ROBIN",
    title: "League",
    subtitle: "Standard round-robin",
    desc: "Every player plays everyone else. Best for balanced competition.",
    icon: "⟳",
    gradient: "from-emerald/20 via-emerald/5 to-transparent",
  },
  {
    id: "KNOCKOUT",
    title: "Knockout",
    subtitle: "Single elimination bracket",
    desc: "Win or go home. High stakes, fast-paced action.",
    icon: "▲",
    gradient: "from-accent/20 via-accent/5 to-transparent",
  },
  {
    id: "GROUPS",
    title: "Group + Knockout",
    subtitle: "World Cup style",
    desc: "Groups of 4, top 2 advance to knockout stage.",
    icon: "◆",
    gradient: "from-gold/20 via-gold/5 to-transparent",
  },
] as const;

const GAME_SPEEDS = ["Slow", "Normal", "Fast"] as const;
const CAMERA_ANGLES = [
  "Tele Broadcast",
  "Co-Op",
  "Pro",
  "Dynamic",
  "End to End",
] as const;

const REAL_CLUBS = [
  "Real Madrid", "Barcelona", "Manchester City", "Manchester United",
  "Arsenal", "Liverpool", "Chelsea", "Tottenham", "Paris Saint-Germain",
  "Bayern Munich", "Borussia Dortmund", "Inter Milan", "AC Milan",
  "Juventus", "Atletico Madrid", "Ajax", "Porto", "Benfica",
  "Celtic", "Rangers", "Galatasaray", "Fenerbahce",
  "Al Hilal", "Al Nassr", "Flamengo", "River Plate", "Boca Juniors",
];

export default function TournamentCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState<string>("KNOCKOUT");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [clubSearch, setClubSearch] = useState("");
  const [assignedTeam, setAssignedTeam] = useState("");
  const [squadType, setSquadType] = useState<"Default" | "Custom">("Default");
  const [halfLength, setHalfLength] = useState(6);
  const [gameSpeed, setGameSpeed] = useState<string>("Normal");
  const [cameraAngle, setCameraAngle] = useState("Tele Broadcast");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filteredClubs = REAL_CLUBS.filter((c) =>
    c.toLowerCase().includes(clubSearch.toLowerCase())
  );

  async function handleSubmit() {
    setError(null);
    setPending(true);

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type: format,
        maxPlayers,
        description: description || undefined,
        settings: {
          halfLengthMinutes: halfLength,
          gameSpeed,
          cameraAngle,
          squadType,
        },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || "Failed to create tournament");
      setPending(false);
      return;
    }

    const tournamentId = data.tournament?.id || data.tournament?.slug;
    if (tournamentId && assignedTeam) {
      await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTeam }),
      }).catch(() => {});
    }

    router.push(`/tournaments/${tournamentId || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
  }

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.push("/tournaments")}
            className="text-muted-soft hover:text-ink text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1 mb-4"
          >
            ← {step > 1 ? "Back" : "Tournaments"}
          </button>
          <h1 className="cinematic-heading text-4xl sm:text-5xl text-ink leading-[0.88] mb-2">
            Create <span className="text-gradient-accent">Tournament</span>
          </h1>
          <p className="text-sm text-muted-soft">Set up your competition in 3 steps</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-8 w-8 rounded-full grid place-items-center text-[11px] font-bold transition-all duration-300 ${
                  s === step
                    ? "bg-accent text-[#0D0D0F]"
                    : s < step
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-surface-2 text-muted-faint border border-border"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:block ${
                s === step ? "text-accent" : "text-muted-faint"
              }`}>
                {s === 1 ? "Format" : s === 2 ? "Team" : "Rules"}
              </span>
              {s < 3 && <div className="flex-1 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="frosted-card-sm p-5 rounded-[20px] mb-4">
                <label className="block">
                  <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Tournament Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={3}
                    maxLength={60}
                    placeholder="e.g. Zim Pro Championship Season 1"
                    className="w-full apple-input px-3 py-2.5 text-ink text-sm"
                  />
                </label>
                <label className="block mt-3">
                  <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Description (optional)</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Rules, prizes, format details..."
                    className="w-full apple-input px-3 py-2.5 text-ink text-sm resize-none"
                  />
                </label>
              </div>

              <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">Choose Format</h2>
              <div className="grid gap-3">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`relative overflow-hidden rounded-[20px] p-5 text-left transition-all duration-300 ${
                      format === f.id
                        ? "border-accent/40 bg-accent/5"
                        : "border-border hover:border-border-strong hover:bg-white/[0.02]"
                    } border`}
                    style={{ background: format === f.id ? undefined : "rgba(255,255,255,0.02)" }}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-50"
                      style={{
                        background:
                          format === f.id
                            ? `radial-gradient(400px 200px at 30% 30%, ${f.gradient})`
                            : undefined,
                      }}
                    />
                    <div className="relative z-10 flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-[14px] grid place-items-center text-xl ${
                        format === f.id ? "bg-accent/10 text-accent" : "bg-surface-2 text-muted-soft"
                      }`}>
                        {f.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-base font-bold ${format === f.id ? "text-accent" : "text-ink"}`}>
                          {f.title}
                        </h3>
                        <p className="text-xs text-muted-soft mt-0.5">{f.subtitle}</p>
                        <p className="text-[11px] text-muted-faint mt-1">{f.desc}</p>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 grid place-items-center shrink-0 mt-1 ${
                        format === f.id ? "border-accent" : "border-border"
                      }`}>
                        {format === f.id && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name || name.length < 3}
                className="w-full h-12 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase cta-primary text-[#0D0D0F] disabled:opacity-30 mt-4"
              >
                Continue → Team Setup
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="frosted-card-sm p-5 rounded-[20px]">
                <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
                  Player Count
                </h2>
                <label className="block">
                  <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Maximum Players</span>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer"
                  >
                    {format === "GROUPS"
                      ? [4, 8, 12, 16, 20, 24, 32].map((n) => (
                          <option key={n} value={n}>{n} players ({n/4} groups of 4)</option>
                        ))
                      : format === "KNOCKOUT"
                      ? [4, 8, 16, 32, 64].map((n) => (
                          <option key={n} value={n}>{n} players</option>
                        ))
                      : [4, 6, 8, 10, 12, 14, 16, 20, 24].map((n) => (
                          <option key={n} value={n}>{n} players</option>
                        ))
                    }
                  </select>
                </label>
              </div>

              <div className="frosted-card-sm p-5 rounded-[20px]">
                <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
                  Your Team Assignment
                </h2>
                <p className="text-[10px] text-muted-faint uppercase tracking-wider mb-3">
                  Choose the real-world club you want to manage in this tournament
                </p>

                <div className="relative mb-3">
                  <input
                    type="text"
                    value={clubSearch}
                    onChange={(e) => setClubSearch(e.target.value)}
                    placeholder="Search clubs..."
                    className="w-full apple-input px-3 py-2.5 text-ink text-sm"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto bc-no-scrollbar space-y-1">
                  {filteredClubs.map((club) => (
                    <button
                      key={club}
                      onClick={() => { setAssignedTeam(club); setClubSearch(club); }}
                      className={`w-full text-left px-3 py-2 rounded-[10px] text-sm transition-all ${
                        assignedTeam === club
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : "text-muted-soft hover:text-ink hover:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      {club}
                    </button>
                  ))}
                  {filteredClubs.length === 0 && (
                    <p className="text-muted-faint text-xs text-center py-4">No clubs found</p>
                  )}
                </div>
              </div>

              <div className="frosted-card-sm p-5 rounded-[20px]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink">Squad Type</h3>
                    <p className="text-[10px] text-muted-soft mt-0.5">
                      {squadType === "Default" ? "Official EA FC stats locked" : "Custom ratings allowed"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSquadType(squadType === "Default" ? "Custom" : "Default")}
                    className={`relative h-7 w-12 rounded-full transition-colors ${
                      squadType === "Default" ? "bg-accent/30" : "bg-surface-2 border border-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                        squadType === "Default" ? "left-0.5" : "left-[22px]"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full h-12 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase cta-primary text-[#0D0D0F] mt-4"
              >
                Continue → Rules & Settings
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="frosted-card-sm p-5 rounded-[20px]">
                <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-4">
                  Match Settings
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Half Length</span>
                    <select
                      value={halfLength}
                      onChange={(e) => setHalfLength(Number(e.target.value))}
                      className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 10, 12, 14].map((n) => (
                        <option key={n} value={n}>{n} min</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Game Speed</span>
                    <select
                      value={gameSpeed}
                      onChange={(e) => setGameSpeed(e.target.value)}
                      className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer"
                    >
                      {GAME_SPEEDS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block col-span-2">
                    <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Camera Angle</span>
                    <select
                      value={cameraAngle}
                      onChange={(e) => setCameraAngle(e.target.value)}
                      className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer"
                    >
                      {CAMERA_ANGLES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="frosted-card-sm p-5 rounded-[20px] border-accent/10">
                <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
                  Summary
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-soft">Name</span>
                    <span className="text-ink font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-soft">Format</span>
                    <span className="text-ink font-medium">
                      {FORMATS.find((f) => f.id === format)?.title || format}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-soft">Players</span>
                    <span className="text-ink font-medium">{maxPlayers}</span>
                  </div>
                  {assignedTeam && (
                    <div className="flex justify-between">
                      <span className="text-muted-soft">Your Club</span>
                      <span className="text-ink font-medium">{assignedTeam}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-soft">Half Length</span>
                    <span className="text-ink font-medium">{halfLength} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-soft">Squad Type</span>
                    <span className="text-ink font-medium">{squadType}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-[12px] border border-negative/25 px-3 py-2.5 text-sm text-negative/90 bg-negative/6">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={pending}
                className="w-full h-14 rounded-[16px] font-bold text-sm tracking-[0.18em] uppercase cta-primary text-[#0D0D0F] disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {pending ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-[#0D0D0F]/30 border-t-[#0D0D0F] animate-spin" />
                    Creating...
                  </>
                ) : (
                  `Create Tournament`
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
