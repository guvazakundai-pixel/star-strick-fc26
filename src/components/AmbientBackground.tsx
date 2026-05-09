"use client";

import { motion } from "framer-motion";

const BLOBS = [
  {
    className: "ambient-blob-1",
    style: {
      background:
        "radial-gradient(circle, rgba(236,72,153,0.13) 0%, rgba(168,85,247,0.06) 40%, transparent 70%)",
    },
    pos: "-top-1/4 -left-1/4",
    size: "w-[1000px] h-[1000px]",
    opacity: 0.25,
  },
  {
    className: "ambient-blob-2",
    style: {
      background:
        "radial-gradient(circle, rgba(34,211,238,0.10) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)",
    },
    pos: "top-1/3 -right-1/4",
    size: "w-[900px] h-[900px]",
    opacity: 0.20,
  },
  {
    className: "ambient-blob-3",
    style: {
      background:
        "radial-gradient(circle, rgba(52,211,153,0.10) 0%, rgba(0,255,133,0.05) 40%, transparent 70%)",
    },
    pos: "-bottom-1/4 left-1/3",
    size: "w-[800px] h-[800px]",
    opacity: 0.18,
  },
  {
    className: "ambient-blob-1",
    style: {
      background:
        "radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(236,72,153,0.04) 40%, transparent 70%)",
    },
    pos: "top-2/3 left-1/4",
    size: "w-[600px] h-[600px]",
    opacity: 0.12,
  },
  {
    className: "ambient-blob-2",
    style: {
      background:
        "radial-gradient(circle, rgba(255,184,0,0.06) 0%, rgba(249,115,22,0.03) 40%, transparent 70%)",
    },
    pos: "top-1/2 -right-1/3",
    size: "w-[500px] h-[500px]",
    opacity: 0.10,
  },
];

export function AmbientBackground() {
  return (
    <div className="ambient-gradients">
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute ${blob.pos} ${blob.size} rounded-full ${blob.className}`}
          style={{
            ...blob.style,
            opacity: blob.opacity,
            filter: "blur(80px)",
          }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: blob.opacity }}
          transition={{
            duration: 2.5 + i * 0.4,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,133,0.02) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}