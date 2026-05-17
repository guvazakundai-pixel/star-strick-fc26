"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useAuthModal } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

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
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4 overflow-y-auto"
      style={{ background: "rgba(10,10,12,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-md overflow-hidden bc-slide-fade"
        style={{
          borderRadius: "24px",
          background: "rgba(18,20,24,0.88)",
          backdropFilter: "blur(32px) saturate(1.5)",
          WebkitBackdropFilter: "blur(32px) saturate(1.5)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.50), 0 0 0 0.5px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.06) inset",
        }}
      >
        <div className="flex border-b border-white/[0.04]">
          <TabButton active={tab === "signin"} onClick={() => setTab("signin")} label="Sign In" />
          <TabButton active={tab === "join"} onClick={() => setTab("join")} label="Join" />
          <button
            onClick={closeAuth}
            className="ml-auto px-5 text-[#6B6D78] hover:text-[#EDEDED] transition-colors duration-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
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
        "flex-1 py-3.5 text-xs font-bold uppercase tracking-[0.22em] transition-all duration-250 " +
        (active
          ? "text-accent border-b-2 border-accent"
          : "text-[#6B6D78] hover:text-[#BFC3C9]")
      }
      style={active ? { background: "rgba(0,255,133,0.04)" } : undefined}
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
  const setUser = useAuthStore((s) => s.setUser);

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
    const data = await res.json();
    setUser(data.user);
    startTransition(() => {
      onClose();
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
          ZIM FCPRO
        </p>
        <h2 className="heading-cinematic text-2xl text-ink mt-1">Welcome back</h2>
      </div>
      {error && <ErrorBox message={error} />}
      <FieldInput label="Username or email" value={identifier} onChange={setIdentifier} autoComplete="username" required />
      <FieldInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none"
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
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, username, email, password, platform, phone, whatsapp }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Registration failed");
      return;
    }
    const data = await res.json();
    setUser(data.user);
    startTransition(() => {
      onClose();
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
          ZIM FCPRO
        </p>
        <h2 className="heading-cinematic text-2xl text-ink mt-1">Create account</h2>
      </div>
      {error && <ErrorBox message={error} />}
      <FieldInput label="Display Name" value={displayName} onChange={setDisplayName} hint="3-30 characters" minLength={3} maxLength={30} required />
      <FieldInput label="EA FC Username" value={username} onChange={setUsername} hint="3-20 chars, letters/numbers/underscores" minLength={3} maxLength={20} required />
      <FieldInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
      <FieldInput label="Password" type="password" value={password} onChange={setPassword} hint="8+ characters" minLength={8} autoComplete="new-password" required />
      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-soft mb-1">Platform</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
          {PLATFORMS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
        </select>
      </div>
      <FieldInput label="Phone Number (optional)" type="tel" value={phone} onChange={setPhone} hint="For voice call challenges" />
      <FieldInput label="WhatsApp (optional)" type="tel" value={whatsapp} onChange={setWhatsapp} hint="For WhatsApp contact" />
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required className="mt-0.5 h-4 w-4 rounded border-white/[0.12] accent-[#00ff85]" />
        <span className="text-xs text-[#8E909A] leading-snug">I agree to the ZIM FCPRO rules and community guidelines</span>
      </label>
      <button type="submit" disabled={pending || !terms} className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none">
        {pending ? "Creating account…" : "Join ZIM FCPRO"}
      </button>
    </form>
  );
}

function FieldInput({ label, type = "text", value, onChange, hint, ...rest }: { label: string; type?: string; value: string; onChange: (v: string) => void; hint?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value">) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm" {...rest} />
      {hint && <span className="block text-[10px] text-muted-faint mt-1">{hint}</span>}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-[12px] border border-negative/25 px-3 py-2.5 text-sm text-negative/90" style={{ background: "rgba(255,77,77,0.06)" }}>
      {message}
    </div>
  );
}