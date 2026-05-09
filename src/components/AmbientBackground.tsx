"use client";

import { motion } from "framer-motion";

const BLOBS = [
  {
    className: "ambient-blob-1",
    style: {
      background:
        "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(168,85,247,0.08) 40%, transparent 70%)",
    },
    pos: "-top-1/4 -left-1/4",
    size: "w-[900px] h-[900px]",
    opacity: 0.3,
  },
  {
    className: "ambient-blob-2",
    style: {
      background:
        "radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)",
    },
    pos: "top-1/3 -right-1/4",
    size: "w-[800px] h-[800px]",
    opacity: 0.25,
  },
  {
    className: "ambient-blob-3",
    style: {
      background:
        "radial-gradient(circle, rgba(52,211,153,0.12) 0%, rgba(168,85,247,0.06) 40%, transparent 70%)",
    },
    pos: "-bottom-1/4 left-1/3",
    size: "w-[700px] h-[700px]",
    opacity: 0.2,
  },
  {
    className: "ambient-blob-2",
    style: {
      background:
        "radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(236,72,153,0.05) 40%, transparent 70%)",
    },
    pos: "top-2/3 left-1/4",
    size: "w-[600px] h-[600px]",
    opacity: 0.15,
  },
  {
    className: "ambient-blob-1",
    style: {
      background:
        "radial-gradient(circle, rgba(239,68,68,0.06) 0%, rgba(249,115,22,0.04) 40%, transparent 70%)",
    },
    pos: "top-1/2 -left-1/3",
    size: "w-[500px] h-[500px]",
    opacity: 0.12,
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
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: blob.opacity }}
          transition={{
            duration: 2 + i * 0.5,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        />
      ))}
    </div>
  );
}