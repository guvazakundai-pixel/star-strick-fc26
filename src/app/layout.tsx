import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { AuthProvider, AuthUrlHandler } from "@/lib/auth-context";
import { AuthHydrator } from "@/components/AuthHydrator";
import { AuthModal } from "@/components/AuthModal";
import { AmbientBackground } from "@/components/AmbientBackground";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/ui/PageTransition";
import { HeroSkeleton } from "@/components/ui/Skeleton";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const SITE_URL = "https://zimfcpro.vercel.app";
const SITE_TITLE = "ZIM FCPRO — Zimbabwe Pro EA FC Rankings";
const SITE_DESC =
  "Official rankings, clubs and tournaments for Zimbabwe's competitive EA Sports FC scene.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s · ZIM FCPRO" },
  description: SITE_DESC,
  applicationName: "ZIM FCPRO",
  keywords: [
    "EA FC",
    "FC26",
    "Zimbabwe esports",
    "FIFA Zimbabwe",
    "EA Sports FC league",
    "ZIM FCPRO",
  ],
  openGraph: {
    type: "website",
    siteName: "ZIM FCPRO",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full"
    >
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-dynamic bg-bg text-ink antialiased overflow-x-hidden" suppressHydrationWarning>
        <QueryProvider>
        <AuthProvider>
          <ErrorBoundary scope="app-shell">
            <Suspense fallback={null}>
              <AuthUrlHandler />
              <AuthHydrator />
            </Suspense>
            <AmbientBackground />
            <div className="relative z-10 min-h-screen flex flex-col pl-[var(--safe-area-left)] pr-[var(--safe-area-right)]">
              <ErrorBoundary scope="topbar">
                <TopBar />
              </ErrorBoundary>
              <main className="flex-1 pb-28">
                <ErrorBoundary scope="page-content">
                  <Suspense fallback={<HeroSkeleton />}>
                    <PageTransition>
                      {children}
                    </PageTransition>
                  </Suspense>
                </ErrorBoundary>
              </main>
              <ErrorBoundary scope="bottom-nav">
                <BottomNav />
              </ErrorBoundary>
            </div>
            <ErrorBoundary scope="auth-modal">
              <AuthModal />
            </ErrorBoundary>
          </ErrorBoundary>
        </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}