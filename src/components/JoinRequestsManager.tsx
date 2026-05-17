"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type RequestUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type JoinRequest = {
  id: string;
  message: string | null;
  createdAt: string;
  user: RequestUser;
};

type JoinRequestsManagerProps = {
  clubId: string;
  isManager: boolean;
  isMember: boolean;
  onJoin?: () => void;
};

export function JoinRequestsManager({ clubId, isManager, isMember, onJoin }: JoinRequestsManagerProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    if (!isManager) return;
    fetch(`/api/clubs/${clubId}/join-requests`)
      .then((r) => r.json())
      .then((d) => {
        setRequests(d.requests ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clubId, isManager]);

  async function handleAction(requestId: string, action: "APPROVE" | "REJECT") {
    const res = await fetch(`/api/clubs/${clubId}/join-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  }

  async function handleSendRequest() {
    setSending(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/join-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestMessage || undefined }),
      });
      if (res.ok) {
        setHasRequested(true);
        setShowModal(false);
      }
    } finally {
      setSending(false);
    }
  }

  if (isManager) {
    if (loading) return null;
    if (requests.length === 0) return null;
    return (
      <div className="frosted-card overflow-hidden rounded-[20px]">
        <div className="px-5 py-3 border-b border-border-faint flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.24em] text-gold">
            Join Requests ({requests.length})
          </h2>
        </div>
        <div className="divide-y divide-border-faint">
          <AnimatePresence mode="popLayout">
            {requests.map((req) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0 overflow-hidden">
                  {req.user.avatarUrl ? (
                    <img src={req.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (req.user.displayName || req.user.username)[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">
                    {req.user.displayName || req.user.username}
                  </p>
                  <p className="text-[10px] text-muted-faint">@{req.user.username}</p>
                  {req.message && (
                    <p className="text-[11px] text-muted-soft mt-1 line-clamp-2">{req.message}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(req.id, "APPROVE")}
                    className="h-8 px-3 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "REJECT")}
                    className="h-8 px-3 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-negative/10 text-negative border border-negative/20 hover:bg-negative/20 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (!isMember && !hasRequested) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary w-full mt-4"
        >
          Request to Join
        </button>

        {showModal && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ background: "rgba(10,10,12,0.82)", backdropFilter: "blur(12px)" }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="frosted-card p-6 rounded-[24px] max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="cinematic-heading text-xl text-ink mb-2">Request to Join</h3>
              <p className="text-sm text-muted-soft mb-4">
                Send a message to the club managers explaining why you want to join.
              </p>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Optional: Tell us about yourself..."
                rows={3}
                className="w-full rounded-[14px] px-4 py-3 text-sm text-ink outline-none resize-none mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 rounded-[14px] text-sm font-bold text-muted-soft border border-border-faint hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={sending}
                  className="flex-1 h-11 rounded-[14px] text-sm font-bold cta-primary"
                >
                  {sending ? "Sending..." : "Send Request"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </>
    );
  }

  if (hasRequested) {
    return (
      <div className="mt-4 p-4 rounded-[16px] text-center" style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.12)" }}>
        <p className="text-sm text-gold font-bold">Request Sent</p>
        <p className="text-[11px] text-muted-soft mt-1">Waiting for club managers to approve</p>
      </div>
    );
  }

  return null;
}
