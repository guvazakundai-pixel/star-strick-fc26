"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AuthModalCTA } from "@/components/AuthModalCTA";

export function JoinCTA() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(900px 500px at 50% 50%, rgba(0,230,118,0.06), transparent 60%), radial-gradient(700px 400px at 30% 60%, rgba(168,85,247,0.04), transparent 60%), radial-gradient(600px 350px at 70% 40%, rgba(34,211,238,0.03), transparent 60%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/8 border border-accent/15 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.24em] text-accent">Season 1 Is Live</span>
          </div>

          <h2 className="cinematic-heading text-4xl sm:text-6xl md:text-7xl text-ink leading-[0.88]">
            Ready to
            <br />
            <span className="text-gradient-hero">Dominate?</span>
          </h2>
          <p className="mt-6 max-w-lg mx-auto text-[15px] text-muted-soft leading-relaxed">
            Join tournaments, climb the ZW rankings, represent a club, and prove you&apos;re the best EA FC player in Zimbabwe.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <AuthModalCTA
              tab="join"
              className="btn-primary inline-flex items-center justify-center h-14 px-10 font-bold text-base tracking-wide"
              style={{ boxShadow: "0 0 48px rgba(0,230,118,0.30), 0 0 96px rgba(0,230,118,0.12), 0 8px 32px rgba(0,0,0,0.25)" }}
            >
              Join Now
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-5 w-5">
                <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
              </svg>
            </AuthModalCTA>
            <Link
              href="/tournaments"
              className="btn-ghost inline-flex items-center justify-center h-14 px-10 font-bold text-base tracking-wide"
            >
              Browse Tournaments
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div>
              <p className="cinematic-heading text-3xl text-accent">3</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-faint mt-1">Tournament Types</p>
            </div>
            <div>
              <p className="cinematic-heading text-3xl text-accent">7</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-faint mt-1">Pro Clubs</p>
            </div>
            <div>
              <p className="cinematic-heading text-3xl text-accent">∞</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-faint mt-1">Possibilities</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
