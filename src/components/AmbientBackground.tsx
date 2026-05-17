"use client";

import { useEffect, useState } from "react";

const BLOBS = [
  {
    className: "ambient-blob-1",
    style: {
      background:
        "radial-gradient(circle, rgba(236,72,153,0.14) 0%, rgba(168,85,247,0.07) 40%, transparent 70%)",
    },
    pos: "-top-1/4 -left-1/4",
    size: "w-[1100px] h-[1100px]",
    opacity: 0.28,
  },
  {
    className: "ambient-blob-2",
    style: {
      background:
        "radial-gradient(circle, rgba(34,211,238,0.11) 0%, rgba(59,130,246,0.07) 40%, transparent 70%)",
    },
    pos: "top-1/4 -right-1/4",
    size: "w-[950px] h-[950px]",
    opacity: 0.22,
  },
  {
    className: "ambient-blob-3",
    style: {
      background:
        "radial-gradient(circle, rgba(52,211,153,0.11) 0%, rgba(0,255,133,0.05) 40%, transparent 70%)",
    },
    pos: "-bottom-1/4 left-1/3",
    size: "w-[850px] h-[850px]",
    opacity: 0.20,
  },
  {
    className: "ambient-blob-4",
    style: {
      background:
        "radial-gradient(circle, rgba(59,130,246,0.09) 0%, rgba(236,72,153,0.04) 40%, transparent 70%)",
    },
    pos: "top-2/3 left-1/4",
    size: "w-[650px] h-[650px]",
    opacity: 0.14,
  },
  {
    className: "ambient-blob-2",
    style: {
      background:
        "radial-gradient(circle, rgba(255,184,0,0.07) 0%, rgba(249,115,22,0.03) 40%, transparent 70%)",
    },
    pos: "top-1/2 -right-1/3",
    size: "w-[550px] h-[550px]",
    opacity: 0.12,
  },
];

export function AmbientBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="ambient-gradients" suppressHydrationWarning>
        {BLOBS.map((blob, i) => (
          <div
            key={i}
            className={`absolute ${blob.pos} ${blob.size} rounded-full ${blob.className}`}
            style={{
              ...blob.style,
              opacity: blob.opacity,
              filter: "blur(90px)",
            }}
            suppressHydrationWarning
          />
        ))}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,133,0.025) 0%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 80% 100%, rgba(168,85,247,0.015) 0%, transparent 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="ambient-gradients">
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className={`absolute ${blob.pos} ${blob.size} rounded-full ${blob.className}`}
          style={{
            ...blob.style,
            opacity: blob.opacity,
            filter: "blur(90px)",
            animation: `ambient-drift-${i < 4 ? i + 1 : 2} ${35 + i * 5}s ease-in-out infinite`,
          }}
          suppressHydrationWarning
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,133,0.025) 0%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 100%, rgba(168,85,247,0.015) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}