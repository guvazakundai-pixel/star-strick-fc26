"use client";

import { TournamentListClient } from "@/components/tournaments/TournamentListClient";
import Link from "next/link";

export default function TournamentsPage() {
  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[10px] font-black tracking-[0.28em] uppercase text-accent">Competitions</span>
            </div>
            <h1 className="cinematic-heading text-4xl sm:text-6xl text-ink leading-[0.88]">
              <span className="text-gradient-accent">Tournaments</span>
            </h1>
            <p className="mt-2 text-sm text-muted-soft">Compete, climb, conquer — ZW tournament circuit.</p>
          </div>
          <Link
            href="/tournaments/create"
            className="shrink-0 h-11 px-5 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase cta-primary text-[#0D0D0F] flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create
          </Link>
        </div>
        <TournamentListClient />
      </div>
    </div>
  );
}
