"use client";

import { useAuthModal, useUser } from "@/lib/auth-context";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthModalCTA({
  tab,
  children,
  className,
  style,
  href,
}: {
  tab: "signin" | "join";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
}) {
  const { openAuth } = useAuthModal();
  const { isAuthenticated, loading } = useUser();

  if (loading) return <div className={className} style={style}>{children}</div>;

  if (isAuthenticated) {
    return (
      <Link href={href ?? "/dashboard"} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={() => openAuth(tab)} className={className} style={style}>
      {children}
    </button>
  );
}