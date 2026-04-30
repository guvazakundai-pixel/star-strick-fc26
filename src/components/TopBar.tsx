import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-br/60 glass">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="relative inline-flex items-center justify-center h-8 w-8 rounded-md bg-neon/10 ring-1 ring-neon/40">
            <span className="font-display text-neon text-xl leading-none translate-y-[1px]">
              S
            </span>
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-neon live-dot" />
          </span>
          <div className="leading-none">
            <p className="font-display tracking-wider text-text text-lg">
              STAR STRICK
            </p>
            <p className="font-mono text-[10px] text-muted -mt-0.5">
              FC26 · ZIMBABWE
            </p>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-br px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-neon live-dot" />
            <span>LIVE · S1 W12</span>
          </span>
        </div>
      </div>
    </header>
  );
}
