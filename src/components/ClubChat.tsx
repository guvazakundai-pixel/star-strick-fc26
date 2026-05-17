"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type ChatUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type ChatMsg = {
  id: string;
  content: string;
  createdAt: string;
  user: ChatUser;
};

type ClubChatProps = {
  clubId: string;
  currentUserId: string;
};

export function ClubChat({ clubId, currentUserId }: ClubChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/clubs/${clubId}/chat`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clubId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setInput("");
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-[400px] sm:h-[500px] rounded-[20px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,12,0.6)" }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-white/[0.03] animate-pulse" style={{ width: `${60 + i * 20}%` }} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-muted-faint mb-3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm text-muted-soft">No messages yet</p>
            <p className="text-[10px] text-muted-faint mt-1">Be the first to say something</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === currentUserId;
            const name = msg.user.displayName || msg.user.username;
            const time = new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <div className="shrink-0 h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent overflow-hidden">
                  {msg.user.avatarUrl ? (
                    <img src={msg.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    name[0].toUpperCase()
                  )}
                </div>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold text-muted-faint">{isMe ? "You" : name}</span>
                    <span className="text-[8px] text-muted-faint/50">{time}</span>
                  </div>
                  <div
                    className={`rounded-[16px] px-3.5 py-2 text-sm leading-relaxed ${
                      isMe
                        ? "bg-accent/15 text-ink rounded-tr-[4px]"
                        : "bg-white/[0.04] text-muted-soft rounded-tl-[4px]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border-faint">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-10 rounded-[12px] px-4 text-sm text-ink outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            disabled={sending}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="shrink-0 h-10 w-10 rounded-[12px] flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{
              background: input.trim() ? "var(--accent)" : "rgba(255,255,255,0.06)",
              color: input.trim() ? "#0D0D0F" : "var(--muted-faint)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
