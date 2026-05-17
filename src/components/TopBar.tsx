import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignInButton } from "@/components/SignInButton";
import { NotificationBell } from "@/components/match/NotificationBell";

export async function TopBar() {
  const session = await getSession();
  const isAdmin = session && (session.role === "MANAGER" || session.role === "ADMIN");

  return (
    <header
      className="sticky top-0 z-40 border-b border-b-white/[0.03]"
      style={{
        background: "radial-gradient(800px 60px at 50% 0%, rgba(0,255,133,0.03) 0%, transparent 60%), rgba(10,10,12,0.82)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className="inline-grid place-items-center h-8 w-8 rounded-[10px] text-accent font-display text-base leading-none group-hover:shadow-[0_0_20px_rgba(0,255,133,0.15)] transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,133,0.12) 0%, rgba(0,255,133,0.03) 100%)",
              border: "1px solid rgba(0,255,133,0.20)",
            }}
          >
            S
          </span>
          <div className="leading-tight">
            <p className="cinematic-heading tracking-wider text-ink text-sm sm:text-base">
              ZIM FCPRO
            </p>
            <p className="font-mono text-[9px] text-muted-faint tracking-wider">
              FC26 · ZW
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex rounded-[10px] border border-accent/18 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-accent hover:bg-accent/8 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(0,255,133,0.06)] transition-all duration-300"
              style={{ background: "rgba(0,255,133,0.05)" }}
            >
              Control Panel
            </Link>
          )}
          {session && (
            <>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-300"
              >
                Dashboard
              </Link>
            </>
          )}
          {!session && <SignInButton />}
          <span className="hidden md:inline-flex items-center gap-2 font-mono text-[10px] text-muted-soft">
            S1 · <span className="text-accent bc-live-dot">●</span> <span className="text-shimmer">Live</span>
          </span>
        </div>
      </div>
    </header>
  );
}