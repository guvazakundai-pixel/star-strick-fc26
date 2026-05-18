"use client";

import Link from "next/link";

export default function ClubHubPage() {
  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 250px at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
          <h1 className="cinematic-heading text-3xl sm:text-5xl text-ink mt-1.5">
            Clubs <span className="text-gradient-pink">Hub</span>
          </h1>
          <p className="mt-2 text-sm text-muted max-w-lg">Everything clubs — manage, recruit, compete, and track your esports organization.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-28 space-y-3">
        <Section title="Star Strick FC">
          <Link href="/club/star-strick-fc" className="glass-card">View Club Profile</Link>
          <Link href="/club/star-strick-fc/manage" className="glass-card">Club Management Dashboard</Link>
        </Section>

        <Section title="Operations Center">
          <Link href="/club/control-tower" className="glass-card">Club Control Tower</Link>
          <Link href="/clubs" className="glass-card">Browse All Clubs</Link>
          <Link href="/clubs?q=star-strick-fc" className="glass-card">Find Star Strick FC</Link>
        </Section>

        <Section title="Quick Links">
          <Link href="/dashboard" className="glass-card">Player Dashboard</Link>
          <Link href="/admin/control-tower" className="glass-card">Admin Control Tower</Link>
          <Link href="/admin/command-center" className="glass-card">Command Center (Super Admin)</Link>
        </Section>
      </div>

      <style jsx>{`
        .glass-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          color: var(--ink);
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
          text-decoration: none;
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(0,255,133,0.2);
          transform: scale(1.01);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-[24px] p-5 space-y-2">
      <h2 className="text-sm font-bold text-ink mb-2">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
