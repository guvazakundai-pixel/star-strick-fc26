import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
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
        <span className="hidden sm:inline-flex items-center gap-2 font-mono text-[11px] text-muted">
          Season 1 · Week 12
        </span>
      </div>
    </header>
  );
}
