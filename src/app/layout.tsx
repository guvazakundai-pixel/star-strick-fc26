import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Bebas_Neue, JetBrains_Mono, Exo_2, Barlow } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { AuthProvider, AuthUrlHandler } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
  display: "swap",
});

const exo = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo",
  display: "swap",
});

const barlow = Barlow({
  weight: ["700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const SITE_URL = "https://star-strick-fc26.vercel.app";
const SITE_TITLE = "Star Strick FC26 — Zimbabwe Pro EA FC Rankings";
const SITE_DESC =
  "Official rankings, clubs and tournaments for Zimbabwe's competitive EA Sports FC scene.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s · Star Strick FC26" },
  description: SITE_DESC,
  applicationName: "Star Strick FC26",
  keywords: [
    "EA FC",
    "FC26",
    "Zimbabwe esports",
    "FIFA Zimbabwe",
    "EA Sports FC league",
    "Star Strick",
  ],
  openGraph: {
    type: "website",
    siteName: "Star Strick FC26",
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
  themeColor: "#f7f8fa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${jbMono.variable} ${exo.variable} ${barlow.variable} h-full`}
    >
      <body className="min-h-full bg-bg text-ink antialiased">
        <AuthProvider>
          <Suspense fallback={null}>
            <AuthUrlHandler />
          </Suspense>
          <div className="min-h-screen flex flex-col">
            <TopBar />
            <main className="flex-1 pb-24">{children}</main>
            <BottomNav />
          </div>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
