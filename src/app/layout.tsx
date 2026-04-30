import type { Metadata, Viewport } from "next";
import { Bebas_Neue, JetBrains_Mono, Exo_2 } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
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

export const metadata: Metadata = {
  title: "Star Strick FC26 — Zimbabwe's Pro EA FC League",
  description:
    "Live rankings, tournaments and clubs for the Star Strick FC26 competitive scene across Zimbabwe.",
};

export const viewport: Viewport = {
  themeColor: "#030509",
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
      className={`${bebas.variable} ${jbMono.variable} ${exo.variable} h-full`}
    >
      <body className="min-h-full bg-bg text-text antialiased">
        <div className="bg-grid min-h-screen flex flex-col">
          <TopBar />
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
