"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type FriendUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  online?: boolean;
};

type FriendRequest = {
  id: string;
  sender: FriendUser;
  receiver: FriendUser;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
};

type FriendsPanelProps = {
  friends: FriendUser[];
  requests: FriendRequest[];
  currentUserId: string;
  onSearch: (query: string) => Promise<FriendUser[]>;
  onSendRequest: (userId: string) => Promise<void>;
  onRespond: (requestId: string, accept: boolean) => Promise<void>;
  onRemove: (friendId: string) => Promise<void>;
  className?: string;
};

export function FriendsPanel({
  friends,
  requests,
  currentUserId,
  onSearch,
  onSendRequest,
  onRespond,
  onRemove,
  className = "",
}: FriendsPanelProps) {
  const [tab, setTab] = useState<"friends" | "requests" | "add">("friends");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await onSearch(q);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }, [onSearch]);

  const incomingRequests = requests.filter((r) => r.receiver.id === currentUserId);
  const outgoingRequests = requests.filter((r) => r.sender.id === currentUserId);

  return (
    <div className={`frosted-card overflow-hidden rounded-[24px] ${className}`}>
      <div className="flex border-b border-border-faint">
        {(["friends", "requests", "add"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
              tab === t ? "text-accent bg-accent/5" : "text-muted-soft hover:text-ink"
            }`}
          >
            {t === "friends" ? `Friends (${friends.length})` : t === "requests" ? `Requests (${requests.length})` : "Add"}
          </button>
        ))}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {tab === "friends" && (
            <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
              {friends.length === 0 ? (
                <p className="text-xs text-muted-soft text-center py-6">No friends yet</p>
              ) : (
                friends.map((f) => (
                  <motion.div
                    key={f.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2.5 rounded-[14px] hover:bg-white/[0.02] transition-colors"
                  >
                    <Link href={`/player/${f.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div
                          className="h-8 w-8 rounded-[10px] flex items-center justify-center text-xs font-bold"
                          style={{
                            background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {(f.displayName || f.username)[0].toUpperCase()}
                        </div>
                        {f.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-bg" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink truncate">{f.displayName || f.username}</p>
                        <p className="text-[10px] text-muted-faint">@{f.username}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => onRemove(f.id)}
                      className="text-[10px] text-muted-faint hover:text-negative transition-colors px-2"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {tab === "requests" && (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {incomingRequests.length > 0 && (
                <div>
                  <p className="text-[9px] font-black tracking-[0.2em] uppercase text-muted-faint mb-2">Incoming</p>
                  {incomingRequests.map((r) => (
                    <motion.div
                      key={r.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2.5 rounded-[14px]"
                      style={{ background: "rgba(0,255,133,0.03)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="h-8 w-8 rounded-[10px] flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {(r.sender.displayName || r.sender.username)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ink">{r.sender.displayName || r.sender.username}</p>
                          <p className="text-[10px] text-muted-faint">@{r.sender.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onRespond(r.id, true)}
                          className="px-3 py-1 rounded-[10px] text-[10px] font-bold text-black"
                          style={{ background: "var(--accent)" }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onRespond(r.id, false)}
                          className="px-3 py-1 rounded-[10px] text-[10px] font-bold text-muted-soft"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          Decline
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {outgoingRequests.length > 0 && (
                <div>
                  <p className="text-[9px] font-black tracking-[0.2em] uppercase text-muted-faint mb-2">Pending Sent</p>
                  {outgoingRequests.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-[14px]" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div
                        className="h-8 w-8 rounded-[10px] flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {(r.receiver.displayName || r.receiver.username)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink">{r.receiver.displayName || r.receiver.username}</p>
                        <p className="text-[10px] text-muted-faint">Request sent</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {requests.length === 0 && (
                <p className="text-xs text-muted-soft text-center py-6">No pending requests</p>
              )}
            </motion.div>
          )}

          {tab === "add" && (
            <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="input-premium relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-faint">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search players..."
                  className="w-full h-11 pl-10 pr-4 rounded-[14px] text-sm text-ink outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
              </div>
              <div className="mt-2 space-y-1">
                {searching ? (
                  <p className="text-xs text-muted-faint text-center py-4">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-2.5 rounded-[14px] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="h-8 w-8 rounded-[10px] flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {(u.displayName || u.username)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ink">{u.displayName || u.username}</p>
                          <p className="text-[10px] text-muted-faint">@{u.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onSendRequest(u.id)}
                        className="px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider text-black"
                        style={{ background: "var(--accent)" }}
                      >
                        Add
                      </button>
                    </motion.div>
                  ))
                ) : search.length >= 2 ? (
                  <p className="text-xs text-muted-faint text-center py-4">No players found</p>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
