"use client";

import { useAuthModal } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function AuthModalCTA({
  tab,
  children,
  className,
}: {
  tab: "signin" | "join";
  children: ReactNode;
  className?: string;
}) {
  const { openAuth } = useAuthModal();
  return (
    <button onClick={() => openAuth(tab)} className={className}>
      {children}
    </button>
  );
}