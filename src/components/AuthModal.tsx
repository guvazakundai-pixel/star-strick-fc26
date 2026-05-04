"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useAuthModal } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Tab = "signin" | "join";

const PLATFORMS = [
  { value: "CROSSPLAY", label: "Crossplay" },
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox Series X|S" },
  { value: "PC", label: "PC (EA App)" },
] as const;

export function AuthModal() {
  const { open, tab: initialTab, closeAuth } = useAuthModal();
  const [tab, setTab] = useState<Tab>(initialTab);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAuth();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeAuth]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) closeAuth();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-[#333] bg-[#1a1a1a] overflow-hidden bc-slide-fade">
        <div className="flex border-b border-[#333]">
          <TabButton active={tab === "signin"} onClick={() => setTab("signin")} label="Sign In" />
          <TabButton active={tab === "join"} onClick={() => setTab("join")} label="Join" />
          <button
            onClick={closeAuth}
            className="ml-auto px-4 text-[#9a9a9a] hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          {tab === "signin" ? <SignInForm onClose={closeAuth} /> : <JoinForm onClose={closeAuth} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 py-3 text-xs font-black uppercase tracking-[0.22em] transition-colors " +
        (active
          ? "text-[#00ff85] border-b-2 border-[#00ff85] bg-[#00ff85]/5"
          : "text-[#9a9a9a] hover:text-white")
      }
    >
      {label}
    </button>
  );
}

function SignInForm({ onClose }: { onClose: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Login failed");
      return;
    }
    startTransition(() => {
      onClose();
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a9a]">
          Star Strick FC26
        </p>
        <h2 className="bc-headline text-2xl text-white">Welcome back</h2>
      </div>
      {error && <ErrorBox message={error} />}
      <FieldInput
        label="Username or email"
        value={identifier}
        onChange={setIdentifier}
        autoComplete="username"
        required
      />
      <FieldInput
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-[#00ff85] py-2.5 font-bold uppercase tracking-wider text-[#050505] hover:bg-white transition disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

function JoinForm({ onClose }: { onClose: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [platform, setPlatform] = useState("CROSSPLAY");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, username, email, password, platform }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Registration failed");
      return;
    }
    startTransition(() => {
      onClose();
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a9a]">
          Star Strick FC26
        </p>
        <h2 className="bc-headline text-2xl text-white">Create account</h2>
      </div>
      {error && <ErrorBox message={error} />}
      <FieldInput
        label="Display Name"
        value={displayName}
        onChange={setDisplayName}
        hint="3-30 characters"
        minLength={3}
        maxLength={30}
        required
      />
      <FieldInput
        label="EA FC Username"
        value={username}
        onChange={setUsername}
        hint="3-20 chars, letters/numbers/underscores, unique"
        minLength={3}
        maxLength={20}
        required
      />
      <FieldInput
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      <FieldInput
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        hint="8+ characters"
        minLength={8}
        autoComplete="new-password"
        required
      />
      <div>
        <label className="block text-xs uppercase tracking-wider text-[#9a9a9a] mb-1">
          Platform
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4 rounded border-[#333] accent-[#00ff85]"
        />
        <span className="text-xs text-[#9a9a9a] leading-snug">
          I agree to the Star Strick FC26 rules and community guidelines
        </span>
      </label>
      <button
        type="submit"
        disabled={pending || !terms}
        className="w-full rounded bg-[#00ff85] py-2.5 font-bold uppercase tracking-wider text-[#050505] hover:bg-white transition disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Join Star Strick FC26"}
      </button>
    </form>
  );
}

function FieldInput({
  label,
  type = "text",
  value,
  onChange,
  hint,
  ...rest
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value">) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-[#9a9a9a] mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm"
        {...rest}
      />
      {hint && <span className="block text-[10px] text-[#666] mt-1">{hint}</span>}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </div>
  );
}