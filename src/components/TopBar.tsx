import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignInButton } from "@/components/SignInButton";

export async function TopBar() {
  const session = await getSession();
  const isAdmin = session && (session.role === "MANAGER" || session.role === "ADMIN");

  return (
    <header
      className="sticky top-0 z-40 border-b border-b-white/[0.03]"
      style={{
        background: "rgba(13,13,15,0.72)",
        backdropFilter: "blur(28px) saturate(1.5)",
        WebkitBackdropFilter: "blur(28px) saturate(1.5)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className="inline-grid place-items-center h-9 w-9 rounded-[11px] text-accent font-display text-lg leading-none group-hover:shadow-[0_0_20px_rgba(0,255,133,0.15)] transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,133,0.12) 0%, rgba(0,255,133,0.03) 100%)",
              border: "1px solid rgba(0,255,133,0.20)",
            }}
          >
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
              className="hidden sm:inline-flex rounded-[12px] border border-accent/18 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent hover:bg-accent/8 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(0,255,133,0.06)] transition-all duration-300"
              style={{ background: "rgba(0,255,133,0.05)" }}
            >
              Control Panel
            </Link>
          )}
          {session && (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex rounded-[12px] border border-border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-300"
            >
              Dashboard
            </Link>
          )}
          {!session && <SignInButton />}
          <span className="hidden md:inline-flex items-center gap-2 font-mono text-[11px] text-muted-soft">
            Season 1 · <span className="text-shimmer">Live</span>
          </span>
        </div>
      </div>
    </header>
  );
}