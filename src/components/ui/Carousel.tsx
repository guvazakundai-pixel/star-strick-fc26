"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Carousel({
  items,
  renderItem,
  className = "",
  autoPlay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
  gap = 16,
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  gap?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollTo = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const child = scrollRef.current.children[index] as HTMLElement;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      setCurrentIndex(index);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    const cardWidth = clientWidth * 0.8 + gap;
    const idx = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(Math.min(idx, items.length - 1));
  }, [gap, items.length]);

  useEffect(() => {
    if (!autoPlay || isPaused || items.length < 2) return;
    const timer = setInterval(() => {
      const next = (currentIndex + 1) % items.length;
      scrollTo(next);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isPaused, currentIndex, interval, items.length, scrollTo]);

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="horizontal-scroll"
        style={{ gap }}
      >
        {items.map((item, i) => (
          <div key={i} className="first:ml-0 last:mr-0" style={{ scrollSnapAlign: "start" }}>
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={() => scrollTo(Math.max(0, currentIndex - 1))}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-bg/80 backdrop-blur-xl border border-border flex items-center justify-center text-muted-soft hover:text-ink hover:border-border-strong transition-all opacity-0 group-hover:opacity-100 ${
              !canScrollLeft ? "hidden" : ""
            }`}
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => scrollTo(Math.min(items.length - 1, currentIndex + 1))}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-bg/80 backdrop-blur-xl border border-border flex items-center justify-center text-muted-soft hover:text-ink hover:border-border-strong transition-all opacity-0 group-hover:opacity-100 ${
              !canScrollRight ? "hidden" : ""
            }`}
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {showDots && items.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-6 h-1.5 bg-accent"
                  : "w-1.5 h-1.5 bg-border-strong hover:bg-muted-faint"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LiveTournamentsCarousel({
  tournaments,
  className = "",
}: {
  tournaments: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    participantCount: number;
    maxPlayers: number;
    prizePool: number;
    slug: string;
  }>;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.28em] uppercase text-red-400">Live Now</span>
        </div>
        <h2 className="cinematic-heading text-3xl sm:text-4xl text-ink leading-[0.88]">
          Active <span className="text-gradient-accent">Tournaments</span>
        </h2>
      </div>
      <Carousel
        items={tournaments}
        renderItem={(t) => (
          <a
            href={`/tournaments/${t.slug}`}
            className="block w-[280px] sm:w-[320px] glass-v2 p-5 rounded-2xl card-interactive"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-soft">
                {t.type}
              </span>
              {t.status === "LIVE" && <span className="live-badge text-[8px]">Live</span>}
            </div>
            <h3 className="text-base font-bold text-ink mb-1 truncate">{t.name}</h3>
            <div className="flex items-center gap-4 text-[12px] text-muted-soft">
              <span>{t.participantCount}/{t.maxPlayers} players</span>
              {t.prizePool > 0 && (
                <span className="text-gold">${t.prizePool} prize</span>
              )}
            </div>
            <div className="mt-3 h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-cyan"
                style={{ width: `${(t.participantCount / t.maxPlayers) * 100}%` }}
              />
            </div>
          </a>
        )}
        autoPlay
        interval={4000}
      />
    </div>
  );
}
