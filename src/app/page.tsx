"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { ClubJoinPrompt } from "@/components/ClubJoinPrompt";
import { PlayMatchButton } from "@/components/PlayMatchButton";
import Link from "next/link";

interface Player {
  id: string;
  username: string;
  playerStatus: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  skillRating: number;
  formScore: number;
  winStreak: number;
  rank?: number;
  clubName?: string;
  isCurrentUser?: boolean;
}

interface Club {
  name: string;
  pts: number;
}

export default function App() {
  const { user, logout } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Record<string, unknown>[]>([]);
  const [tab, setTab] = useState<"players" | "clubs" | "matches" | "dashboard">("players");
  const [loading, setLoading] = useState(true);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);

  /* ===== Load data ===== */
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetch("/api/leaderboard").then(r => r.json()),
      fetch(`/api/matches?playerId=${user.id}&status=APPROVED`).then(r => r.json()).catch(() => ({ matches: [] })),
    ])
      .then(([leaderData, matchData]) => {
        const mapped = (leaderData.players ?? []).map((p: Player) => ({
          ...p,
          isCurrentUser: p.id === user.id,
        }));
        setPlayers(mapped);
        setMatches(matchData.matches ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  /* ===== Rankings ===== */
  const ranked = useMemo(() => {
    return [...players]
      .filter(p => p.playerStatus !== "UNPLACED")
      .map(p => ({
        ...p,
        winRate: p.wins + p.losses > 0 ? Math.round((p.wins / (p.wins + p.losses)) * 100) : 0,
      }))
      .sort((a, b) => b.points - a.points)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [players]);

  /* ===== Clubs ===== */
  const clubs = useMemo(() => {
    const map: Record<string, number> = {};
    players.forEach(p => {
      if (p.clubName) {
        map[p.clubName] = (map[p.clubName] || 0) + p.points;
      }
    });
    return Object.entries(map)
      .map(([name, pts]) => ({ name, pts }))
      .sort((a, b) => b.pts - a.pts);
  }, [players]);

  /* ===== If not logged in ===== */
  if (!user) {
    return (
      <div style={{ background: "#030509", minHeight: "100vh", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ padding: 20, maxWidth: 400, width: "100%" }}>
          <h1 style={{ color: "#00FF57", fontSize: 32, fontWeight: "black", textAlign: "center", marginBottom: 8 }}>
            STAR STRIK
          </h1>
          <p style={{ textAlign: "center", color: "#aaa", marginBottom: 24 }}>
            Zimbabwe Pro EA FC Rankings
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href="/login"
              style={{ padding: 12, background: "#00FF57", color: "#000", textAlign: "center", borderRadius: 4, fontWeight: "bold", textDecoration: "none" }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              style={{ padding: 12, border: "1px solid #333", color: "#aaa", textAlign: "center", borderRadius: 4, textDecoration: "none" }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#030509", minHeight: "100vh", color: "#fff" }}>
      {/* NAV */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: 16, borderBottom: "1px solid #222", alignItems: "center" }}>
        <b style={{ color: "#00FF57", fontSize: 18 }}>STAR STRIK</b>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {["players", "clubs", "matches", "dashboard"].map(t => (
            <span
              key={t}
              onClick={() => setTab(t as "players" | "clubs" | "matches" | "dashboard")}
              style={{ cursor: "pointer", color: tab === t ? "#00FF57" : "#aaa", fontWeight: tab === t ? "bold" : "normal" }}
            >
              {t.toUpperCase()}
            </span>
          ))}
          <button
            onClick={() => { logout(); }}
            style={{ padding: "6px 12px", background: "#222", color: "#aaa", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
        {/* ===== PLAYERS / LEADERBOARD ===== */}
        {tab === "players" && (
          <>
            <h2 style={{ marginBottom: 16 }}>Leaderboard</h2>
            {loading ? (
              <p style={{ color: "#666" }}>Loading...</p>
            ) : (
              <LiveLeaderboard />
            )}
          </>
        )}

        {/* ===== CLUBS ===== */}
        {tab === "clubs" && (
          <>
            <h2 style={{ marginBottom: 16 }}>Clubs</h2>
            {clubs.length === 0 ? (
              <p style={{ color: "#666" }}>No clubs yet. Create one from the dashboard!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {clubs.map((c, i) => (
                  <div key={c.name} style={{ padding: 12, border: "1px solid #222", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "bold" }}>#{i + 1} {c.name}</span>
                    <span style={{ color: "#00FF57" }}>{c.pts} pts</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== MATCHES ===== */}
        {tab === "matches" && (
          <>
            <h2 style={{ marginBottom: 16 }}>My Matches</h2>
            <div style={{ marginBottom: 16 }}>
              <Link
                href="/matches/find"
                style={{ padding: "8px 16px", background: "#00FF57", color: "#000", borderRadius: 4, fontWeight: "bold", textDecoration: "none" }}
              >
                + Find Opponent
              </Link>
            </div>
            {matches.length === 0 ? (
              <p style={{ color: "#666" }}>No matches yet. Play your first match!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {matches.map((m: Record<string, unknown>) => (
                  <div key={m.id as string} style={{ padding: 12, border: "1px solid #222" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{(m.player1 as Record<string, unknown>)?.username} vs {(m.player2 as Record<string, unknown>)?.username}</span>
                      <span style={{ color: "#00FF57", fontWeight: "bold" }}>{(m.score1 as number)} - {(m.score2 as number)}</span>
                    </div>
                    <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                      {new Date(m.createdAt as string).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== DASHBOARD ===== */}
        {tab === "dashboard" && (
          <>
            <h2 style={{ marginBottom: 16 }}>Dashboard</h2>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: "#aaa" }}>Welcome, <strong style={{ color: "#00FF57" }}>{user.username}</strong>!</p>
              <p style={{ color: "#666", fontSize: 14 }}>Status: {user.playerStatus}</p>
            </div>

            {/* Quick Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
              {ranked.filter(p => p.isCurrentUser).map(p => (
                <div key={p.id} style={{ padding: 16, border: "1px solid #222" }}>
                  <p style={{ color: "#666", fontSize: 12 }}>YOUR RANK</p>
                  <p style={{ fontSize: 32, fontWeight: "black", color: "#00FF57" }}>#{p.rank}</p>
                </div>
              ))}
              <div style={{ padding: 16, border: "1px solid #222" }}>
                <p style={{ color: "#666", fontSize: 12 }}>POINTS</p>
                <p style={{ fontSize: 32, fontWeight: "black" }}>{user.playerStatus === "UNPLACED" ? "—" : players.find(p => p.id === user.id)?.points ?? 0}</p>
              </div>
              <div style={{ padding: 16, border: "1px solid #222" }}>
                <p style={{ color: "#666", fontSize: 12 }}>MATCHES</p>
                <p style={{ fontSize: 32, fontWeight: "black" }}>{players.find(p => p.id === user.id)?.wins ?? 0 + (players.find(p => p.id === user.id)?.losses ?? 0)}</p>
              </div>
            </div>

            {/* Join Club CTA */}
            {!user.playerStatus || user.playerStatus === "UNPLACED" ? (
              <div style={{ padding: 16, border: "1px solid #00FF57", background: "#002b15", borderRadius: 4, marginBottom: 16 }}>
                <p style={{ color: "#00FF57", fontWeight: "bold" }}>Join a Club to Compete!</p>
                <p style={{ color: "#aaa", fontSize: 14, margin: "8px 0" }}>
                  Matches without a club don't count toward rankings.
                </p>
                <button
                  onClick={() => setShowJoinPrompt(true)}
                  style={{ padding: "8px 16px", background: "#00FF57", color: "#000", border: "none", borderRadius: 4, fontWeight: "bold", cursor: "pointer" }}
                >
                  Join Club
                </button>
              </div>
            ) : null}

            {/* Play Match CTA */}
            <div style={{ padding: 16, border: "1px solid #222", borderRadius: 4, textAlign: "center" }}>
              <p style={{ color: "#aaa", marginBottom: 12 }}>Ready to play?</p>
              <Link
                href="/matches/find"
                style={{ padding: "10px 24px", background: "#00FF57", color: "#000", borderRadius: 4, fontWeight: "bold", textDecoration: "none" }}
              >
                FIND OPPONENT
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Club Join Modal */}
      {showJoinPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0a0a0a", padding: 24, borderRadius: 8, maxWidth: 500, width: "90%" }}>
            <ClubJoinPrompt onClose={() => setShowJoinPrompt(false)} />
          </div>
        </div>
      )}

      <PlayMatchButton />
    </div>
  );
}
