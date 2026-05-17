"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ActivityUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type ActivityComment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string | null };
};

type Activity = {
  id: string;
  type: "post" | "match" | "achievement" | "join";
  message: string;
  user: ActivityUser;
  likes: number;
  liked: boolean;
  comments: ActivityComment[];
  commentCount: number;
  createdAt: string;
  imageUrl: string | null;
};

type SocialFeedProps = {
  activities: Activity[];
  onPost: (content: string) => Promise<void>;
  onLike: (activityId: string) => Promise<void>;
  onComment: (activityId: string, content: string) => Promise<void>;
  className?: string;
};

const TYPE_META: Record<string, { icon: string; color: string }> = {
  post: { icon: "💬", color: "text-accent" },
  match: { icon: "⚽", color: "text-cyan" },
  achievement: { icon: "🏆", color: "text-gold" },
  join: { icon: "👋", color: "text-purple" },
};

export function SocialFeed({ activities, onPost, onLike, onComment, className = "" }: SocialFeedProps) {
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handlePost = useCallback(async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await onPost(newPost);
      setNewPost("");
    } finally {
      setPosting(false);
    }
  }, [newPost, onPost]);

  const handleComment = useCallback(async (activityId: string) => {
    const content = commentInputs[activityId];
    if (!content?.trim()) return;
    await onComment(activityId, content);
    setCommentInputs((prev) => ({ ...prev, [activityId]: "" }));
  }, [commentInputs, onComment]);

  const toggleComments = useCallback((activityId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  }, []);

  const displayed = activities.slice(0, page * pageSize);
  const hasMore = displayed.length < activities.length;

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className="rounded-[20px] p-4"
        style={{ border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}
      >
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share something with the community..."
          className="w-full bg-transparent text-sm text-ink placeholder-muted-faint resize-none outline-none min-h-[60px]"
          rows={2}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-faint">Keep it respectful</span>
          <button
            onClick={handlePost}
            disabled={posting || !newPost.trim()}
            className="px-4 py-1.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wider text-black disabled:opacity-40 transition-all"
            style={{ background: "var(--accent)" }}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {displayed.map((activity, i) => (
          <motion.div
            key={activity.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="frosted-card-sm rounded-[18px] p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className="h-9 w-9 rounded-[12px] flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {(activity.user.displayName || activity.user.username)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">{activity.user.displayName || activity.user.username}</span>
                  <span className={TYPE_META[activity.type]?.color ?? "text-muted-soft"}>
                    <span className="text-[10px]">{TYPE_META[activity.type]?.icon}</span>
                  </span>
                  <span className="text-[10px] text-muted-faint font-mono ml-auto shrink-0">
                    {timeAgo(activity.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-ink-soft mt-1 leading-relaxed">{activity.message}</p>
                {activity.imageUrl && (
                  <img src={activity.imageUrl} alt="" className="mt-3 rounded-[14px] w-full max-h-64 object-cover" />
                )}
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => onLike(activity.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-soft hover:text-accent transition-colors"
                  >
                    <span>{activity.liked ? "❤️" : "🤍"}</span>
                    <span className="font-mono text-[10px]">{activity.likes > 0 ? activity.likes : ""}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(activity.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-soft hover:text-accent transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="font-mono text-[10px]">{activity.commentCount > 0 ? activity.commentCount : ""}</span>
                  </button>
                </div>

                {expandedComments.has(activity.id) && (
                  <div className="mt-3 space-y-2 pl-2 border-l border-border-faint">
                    {activity.comments.map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-bold text-ink">{c.user.displayName || c.user.username}</span>
                        <span className="text-muted-soft ml-1.5">{c.content}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        value={commentInputs[activity.id] || ""}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 bg-transparent text-xs text-ink placeholder-muted-faint outline-none border-b border-border-faint pb-1"
                        onKeyDown={(e) => { if (e.key === "Enter") handleComment(activity.id); }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-accent transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

function timeAgo(date: string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
