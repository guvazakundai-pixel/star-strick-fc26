"use client";

import { useAuthModal } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function AuthModalCTA({
  tab,
  children,
  className,
  style,
}: {
  tab: "signin" | "join";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { openAuth } = useAuthModal();
  return (
    <button onClick={() => openAuth(tab)} className={className} style={style}>
      {children}
    </button>
  );
}