import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignInButton } from "@/components/SignInButton";

export async function TopBar() {
  const session = await getSession();
  const isAdmin = session && (session.role === "MANAGER" || session.role === "ADMIN");

  return (
    <header className="sticky top-0 z-40 bg-bg-elevated/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg-elevated/60 border-b border-border-faint">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-grid place-items-center h-8 w-8 rounded-[10px] bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 text-accent font-display text-lg leading-none group-hover:from-accent/30 group-hover:border-accent/30 transition-all duration-200">
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
              className="hidden sm:inline-flex rounded-[10px] bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-accent hover:bg-accent/15 transition-all duration-200"
            >
              Control Panel
            </Link>
          )}
          {session && (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft hover:bg-bg-highlight hover:text-ink transition-all duration-200"
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