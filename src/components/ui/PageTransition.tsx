"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode, useRef, useCallback, useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const PAGE_TRANSITION = {
  type: "tween" as const,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  duration: 0.28,
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary scope="page-transition">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          variants={PAGE_VARIANTS}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={PAGE_TRANSITION}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export function StaggerContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.055,
            delayChildren: 0.08,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 24,
            mass: 0.8,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function SlideInRight({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 28,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function NumberTicker({ value, className = "" }: { value: number; className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={`tabular-nums ${className}`}>{(value ?? 0).toLocaleString()}</span>;
  }

  return (
    <motion.span
      className={`tabular-nums ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      {(value ?? 0).toLocaleString()}
    </motion.span>
  );
}