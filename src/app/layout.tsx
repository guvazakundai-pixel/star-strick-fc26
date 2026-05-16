import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'STAR STRICK FC26 | Next-Gen Esports Ecosystem',
  description: 'Create leagues, tournaments, and compete in the ultimate esports ecosystem.',
  keywords: ['esports', 'tournament', 'league', 'gaming', 'competitive', 'fc26'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
