"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function InviteRedemptionPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function redeem() {
      try {
        const res = await fetch("/api/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(`Joined ${data.data.name}!`);
          setTimeout(() => {
            if (data.data.leagueId) router.push(`/leagues/${data.data.leagueId}`);
            else if (data.data.clubId) router.push(`/club/${data.data.tag}`);
            else router.push("/dashboard");
          }, 1500);
        } else {
          setStatus("error");
          setMessage(data.error || "Invalid invite");
        }
      } catch {
        setStatus("error");
        setMessage("Network error");
      }
    }
    redeem();
  }, [code, router]);

  return (
    <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="frosted-card p-8 rounded-[28px] max-w-sm w-full text-center">
        {status === "loading" && (
          <div>
            <div className="h-12 w-12 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
            <p className="mt-4 text-ink text-lg">Redeeming invite...</p>
          </div>
        )}
        {status === "success" && (
          <div>
            <span className="text-5xl">✅</span>
            <p className="mt-4 text-accent text-lg font-bold">{message}</p>
            <p className="text-muted-soft text-sm mt-2">Redirecting...</p>
          </div>
        )}
        {status === "error" && (
          <div>
            <span className="text-5xl">❌</span>
            <p className="mt-4 text-negative text-lg font-bold">{message}</p>
            <button onClick={() => router.push("/leagues")} className="btn-primary mt-4 h-11 px-6 text-xs rounded-[14px]">
              Browse Leagues
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
