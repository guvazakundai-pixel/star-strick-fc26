import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignInButton } from "@/components/SignInButton";

export async function TopBar() {
  const session = await getSession();
  const isAdmin = session && (session.role === "MANAGER" || session.role === "ADMIN");

  return (
    <header className="sticky top-0 z-40 border-b border-border-faint" style={{ background: "rgba(14,14,16,0.75)", backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)" }}>
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-grid place-items-center h-8 w-8 rounded-[10px] border border-accent/20 text-accent font-display text-lg leading-none group-hover:border-accent/35 group-hover:shadow-[0_0_16px_rgba(0,255,133,0.10)] transition-all duration-300" style={{ background: "linear-gradient(135deg, rgba(0,255,133,0.10) 0%, rgba(0,255,133,0.02) 100%)" }}>
            S
          </span>
          <div className="leading-tight">
            <p className="font-display tracking-wider text-ink text-base sm:text-lg">
              STAR STRICK
            </p>
            <p className="font-mono text-[10px] text-muted-soft -mt-0.5">
              FC26 · Zimbabwe
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex rounded-[10px] border border-accent/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-accent hover:bg-accent/8 hover:border-accent/25 transition-all duration-200"
              style={{ background: "rgba(0,255,133,0.04)" }}
            >
              Control Panel
            </Link>
          )}
          {session && (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-200"
            >
              Dashboard
            </Link>
          )}
          {!session && <SignInButton />}
          <span className="hidden md:inline-flex items-center gap-2 font-mono text-[11px] text-muted-soft">
            Season 1 · Week 12
          </span>
        </div>
      </div>
    </header>
  );
}