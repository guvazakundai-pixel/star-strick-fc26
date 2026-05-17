import Link from "next/link";

export default function NotFound() {
  return (
    <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div
          className="mx-auto h-24 w-24 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,255,133,0.04)",
            border: "1px solid rgba(0,255,133,0.10)",
          }}
        >
          <span className="bc-headline text-6xl text-accent">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="bc-headline text-4xl text-ink">Page not found</h1>
          <p className="text-muted leading-relaxed">
            This page doesn&apos;t exist or has been moved. Check the URL and try again.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 rounded-[18px] cta-primary px-7 text-sm font-bold text-[#0D0D0F]"
          >
            Go Home
          </Link>
          <Link
            href="/rankings"
            className="inline-flex items-center justify-center h-12 rounded-[18px] cta-outline px-7 text-sm font-bold"
          >
            View Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}