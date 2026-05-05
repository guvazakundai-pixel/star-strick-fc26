import Link from "next/link";
import { getSession } from "@/lib/session";
import { SignInButton } from "@/components/SignInButton";

export async function TopBar() {
  const session = await getSession();
  const isAdmin = session && (session.role === "MANAGER" || session.role === "ADMIN");

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-grid place-items-center h-8 w-8 rounded bg-ink text-surface font-display text-lg leading-none">
            S
          </span>
          <div className="leading-tight">
            <p className="font-display tracking-wider text-ink text-base sm:text-lg">
              STAR STRICK
            </p>
            <p className="font-mono text-[10px] text-muted -mt-0.5">
              FC26 · Zimbabwe
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex rounded bg-ink px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-surface hover:bg-ink-soft"
            >
              Control Panel
            </Link>
          )}
          {session && (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex rounded border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink hover:bg-surface-2"
            >
              Dashboard
            </Link>
          )}
          {!session && <SignInButton />}
          <span className="hidden md:inline-flex items-center gap-2 font-mono text-[11px] text-muted">
            Season 1 · Week 12
          </span>
        </div>
      </div>
    </header>
  );
}
