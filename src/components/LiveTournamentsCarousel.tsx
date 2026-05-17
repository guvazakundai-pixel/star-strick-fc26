"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Carousel } from "@/components/ui/Carousel";

type TournamentCard = {
  id: string;
  name: string;
  type: string;
  status: "LIVE" | "REGISTRATION" | "UPCOMING" | "COMPLETED" | string;
  prizePool: number;
  participantCount: number;
  maxPlayers: number;
  organizerName?: string;
  slug: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-negative/15 border border-negative/25 text-negative text-[8px] font-black uppercase tracking-wider">
        <span className="relative flex h-1.5 w-1.5">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-negative"
            animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-negative" />
        </span>
        Live
      </span>
    );
  }
  if (status === "REGISTRATION") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[8px] font-black uppercase tracking-wider">
        Registration
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-[8px] font-black uppercase tracking-wider">
      Upcoming
    </span>
  );
}

function PrizeBadge({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[8px] font-bold tracking-wide">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
        <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
      ${(amount / 100).toFixed(2)}
    </span>
  );
}

export function LiveTournamentsCarousel({
  tournaments: externalTournaments,
  className = "",
}: {
  tournaments?: TournamentCard[];
  className?: string;
}) {
  const [internalTournaments, setInternalTournaments] = useState<TournamentCard[]>([]);

  useEffect(() => {
    if (externalTournaments) return;
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((d) => setInternalTournaments(d.tournaments ?? []))
      .catch(() => {});
  }, [externalTournaments]);

  const tournaments = externalTournaments ?? internalTournaments;

  const active = useMemo(
    () => tournaments.filter((t) => t.status === "LIVE" || t.status === "REGISTRATION" || t.status === "UPCOMING").slice(0, 12),
    [tournaments],
  );

  if (active.length === 0) return null;

  return (
    <section className={`relative py-16 sm:py-20 ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 300px at 50% 0%, rgba(0,230,118,0.05), transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <motion.span
                  className="absolute inline-flex h-full w-full rounded-full bg-negative opacity-75"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.75, 0, 0.75] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-negative" />
              </span>
              <span className="text-[10px] font-black tracking-[0.28em] uppercase text-negative">Live Tournaments</span>
            </div>
            <h2 className="cinematic-heading text-2xl sm:text-3xl text-ink">
              Active <span className="text-gradient-accent">Competitions</span>
            </h2>
          </div>
          <Link
            href="/tournaments"
            className="text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors shrink-0"
          >
            View All &rarr;
          </Link>
        </motion.div>

        <Carousel
          items={active}
          renderItem={(t: TournamentCard, i: number) => (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
              className="w-[280px] sm:w-[320px]"
            >
              <Link
                href={`/tournaments/${t.slug}`}
                className="group block frosted-card rounded-[20px] overflow-hidden card-interactive h-full relative"
              >
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,255,133,0.06), transparent 50%)",
                  }}
                />
                <div className="relative z-10 p-5 flex flex-col h-full">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[8px] font-black uppercase tracking-wider text-muted-soft">
                      {t.type === "KNOCKOUT" ? "Knockout" : t.type === "ROUND_ROBIN" ? "Round Robin" : t.type}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>

                  <h3 className="cinematic-heading text-base sm:text-lg text-ink truncate leading-tight mb-1 group-hover:text-accent transition-colors duration-200">
                    {t.name}
                  </h3>

                  {t.organizerName && (
                    <p className="text-[10px] text-muted-soft mb-auto">by {t.organizerName}</p>
                  )}

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-muted-soft">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>{t.participantCount}/{t.maxPlayers}</span>
                      </div>
                      <PrizeBadge amount={t.prizePool} />
                    </div>

                    <div className="relative h-1.5 rounded-full bg-border overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-cyan"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min((t.participantCount / t.maxPlayers) * 100, 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-muted-faint">
                      <span>{Math.round((t.participantCount / t.maxPlayers) * 100)}% full</span>
                      {t.maxPlayers - t.participantCount > 0 && (
                        <span>{t.maxPlayers - t.participantCount} spots left</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
          autoPlay
          interval={4000}
          gap={16}
        />
      </div>
    </section>
  );
}
