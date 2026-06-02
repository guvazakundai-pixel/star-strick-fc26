"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useAuthModal } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useAuthStore, type WelcomeData } from "@/store/auth-store";
import { WelcomeOverlay } from "@/components/WelcomeOverlay";

type Tab = "signin" | "join" | "forgot" | "reset";

const PLATFORMS = [
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox Series X|S" },
  { value: "PC", label: "PC (EA App)" },
] as const;

const ZIMBABWEAN_CLUBS = [
  "Caps United", "Dynamos", "Highlanders", "ZPC Kariba",
  "Chicken Inn", "Ngezi Platinum", "Bulawayo Chiefs",
  "GreenFuel", "Manica Diamonds", "Herentals",
  "TelOne", "Black Rhinos", "Yadah", "Hwange",
  "Sheasham", "Arenel Movers", "Mwana Africa", "Simba Bhora",
  "Bikita Minerals", "Chegutu Pirates", "Other",
] as const;

export function AuthModal() {
  const { open, tab: initialTab, closeAuth, resetEmail: initialResetEmail } = useAuthModal();
  const [tab, setTab] = useState<Tab>(initialTab as Tab);
  const backdropRef = useRef<HTMLDivElement>(null);
  const welcomeData = useAuthStore((s) => s.welcomeData);
  const setWelcomeData = useAuthStore((s) => s.setWelcomeData);
  const [resetEmail, setResetEmail] = useState(initialResetEmail || "");

  useEffect(() => {
    setTab(initialTab as Tab);
  }, [initialTab]);

  useEffect(() => {
    if (initialResetEmail) setResetEmail(initialResetEmail);
  }, [initialResetEmail]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAuth();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeAuth]);

  if (welcomeData) {
    return <WelcomeOverlay data={welcomeData} onDismiss={() => { setWelcomeData(null); closeAuth(); }} />;
  }

  if (!open) return null;

  const showTabs = tab === "signin" || tab === "join";

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
        {showTabs && (
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
        )}
        {!showTabs && (
          <div className="flex justify-end border-b border-white/[0.04]">
            <button
              onClick={closeAuth}
              className="px-5 py-3.5 text-[#6B6D78] hover:text-[#EDEDED] transition-colors duration-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6">
          {tab === "signin" && <SignInForm onClose={closeAuth} onForgotPassword={() => setTab("forgot")} />}
          {tab === "join" && <JoinForm onClose={closeAuth} />}
          {tab === "forgot" && <ForgotPasswordForm onBack={() => setTab("signin")} onSuccess={(email) => { setResetEmail(email); setTab("reset"); }} />}
          {tab === "reset" && <ResetPasswordForm email={resetEmail} onBack={() => setTab("forgot")} onSuccess={() => setTab("signin")} />}
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

function SignInForm({ onClose, onForgotPassword }: { onClose: () => void; onForgotPassword: () => void }) {
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
      credentials: "include",
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
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">ZIM FCPRO</p>
        <h2 className="heading-cinematic text-2xl text-ink mt-1">Welcome back</h2>
      </div>
      {error && <ErrorBox message={error} />}
      <FieldInput label="Username or email" value={identifier} onChange={setIdentifier} autoComplete="username" required />
      <FieldInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
      <button type="submit" disabled={pending} className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none">
        {pending ? "Signing in…" : "Sign In"}
      </button>
      <button
        type="button"
        onClick={onForgotPassword}
        className="w-full text-center text-xs text-muted-soft hover:text-accent transition-colors duration-200"
      >
        Forgot your password?
      </button>
    </form>
  );
}

function ForgotPasswordForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div>
          <button onClick={onBack} className="text-xs text-muted-soft hover:text-ink transition-colors duration-200 mb-3 inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M15 18l-6-6 6-6" /></svg>
            Back to sign in
          </button>
          <h2 className="heading-cinematic text-2xl text-ink">Check your email</h2>
          <p className="text-sm text-muted-soft mt-2">
            We&apos;ve sent a 6-digit reset code to <strong className="text-ink">{email}</strong>.
          </p>
        </div>
        <div className="rounded-[12px] border border-accent/20 px-4 py-3 text-sm text-accent" style={{ background: "rgba(0,255,133,0.06)" }}>
          Enter the code on the next screen to set a new password.
        </div>
        <button
          onClick={() => onSuccess(email)}
          className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider"
        >
          Enter Code
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <button onClick={onBack} className="text-xs text-muted-soft hover:text-ink transition-colors duration-200 mb-3 inline-flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M15 18l-6-6 6-6" /></svg>
          Back to sign in
        </button>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">ZIM FCPRO</p>
        <h2 className="heading-cinematic text-2xl text-ink mt-1">Reset password</h2>
        <p className="text-sm text-muted-soft mt-1">Enter the email linked to your account. We&apos;ll send a 6-digit verification code.</p>
      </div>
      {error && <ErrorBox message={error} />}
      <FieldInput label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" required />
      <button type="submit" disabled={pending} className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none">
        {pending ? "Sending…" : "Send Reset Code"}
      </button>
    </form>
  );
}

function ResetPasswordForm({ email, onBack, onSuccess }: { email: string; onBack: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (code.length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, code, newPassword }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Reset failed. The code may be wrong or expired.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="mx-auto h-14 w-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,255,133,0.08)", border: "1px solid rgba(0,255,133,0.20)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#00ff85" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <h2 className="heading-cinematic text-2xl text-ink">Password updated</h2>
        <p className="text-sm text-muted-soft">Your password has been reset. You can now sign in with your new password.</p>
        <button
          onClick={onSuccess}
          className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <button onClick={onBack} className="text-xs text-muted-soft hover:text-ink transition-colors duration-200 mb-3 inline-flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M15 18l-6-6 6-6" /></svg>
          Resend code
        </button>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">ZIM FCPRO</p>
        <h2 className="heading-cinematic text-2xl text-ink mt-1">Enter code</h2>
        <p className="text-sm text-muted-soft mt-1">
          We sent a 6-digit code to <strong className="text-ink">{email}</strong>.
        </p>
      </div>
      {error && <ErrorBox message={error} />}

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">6-digit code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          maxLength={6}
          className="w-full apple-input px-3 py-2.5 text-ink text-sm text-center tracking-[0.4em] font-mono text-lg"
          required
        />
      </div>

      <FieldInput label="New password" type="password" value={newPassword} onChange={setNewPassword} hint="8+ characters" minLength={8} autoComplete="new-password" required />
      <FieldInput label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" required />

      <button type="submit" disabled={pending} className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none">
        {pending ? "Resetting…" : "Reset Password"}
      </button>
    </form>
  );
}

function JoinForm({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [platform, setPlatform] = useState("PS5");
  const [country, setCountry] = useState("Zimbabwe");
  const [favoriteClub, setFavoriteClub] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setWelcomeData = useAuthStore((s) => s.setWelcomeData);

  useEffect(() => {
    if (username.length < 3) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setUsernameAvailable(data.available);
        }
      } catch {} finally {
        setCheckingUsername(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError("You must accept the terms and privacy policy");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fullName,
        username,
        email,
        password,
        confirmPassword,
        platform,
        country,
        favoriteClub,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        termsAccepted,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || j.details?.formErrors?.[0] || "Registration failed");
      return;
    }
    const data = await res.json();
    setUser(data.user);
    if (data.welcome) {
      setWelcomeData(data.welcome as WelcomeData);
    }
    startTransition(() => {
      onClose();
      router.refresh();
    });
  }

  const suggestions = usernameAvailable === false && username.length >= 3
    ? [`${username}FC`, `${username}Pro`, `${username}01`, `${username}_zw`]
    : [];

  return (
    <form onSubmit={onSubmit} className="space-y-3.5 max-h-[70vh] overflow-y-auto px-0.5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">ZIM FCPRO</p>
        <h2 className="heading-cinematic text-2xl text-ink mt-1">Create your football identity</h2>
      </div>
      {error && <ErrorBox message={error} />}

      <FieldInput
        label="Full name" value={fullName} onChange={setFullName}
        hint="Your manager name — will appear on rankings"
        autoComplete="name" required
      />

      <div>
        <FieldInput
          label="Username" value={username} onChange={setUsername}
          hint="3-20 chars, letters/numbers/underscores — your unique football identity"
          minLength={3} maxLength={20} required
          suffix={
            checkingUsername ? (
              <span className="text-muted-faint text-xs animate-pulse">checking…</span>
            ) : usernameAvailable === true ? (
              <span className="text-accent text-xs">✓ available</span>
            ) : usernameAvailable === false ? (
              <span className="text-negative text-xs">✕ taken</span>
            ) : null
          }
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setUsername(s)}
                className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-muted-soft hover:text-accent hover:border-accent/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <FieldInput label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" required />

      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Password" type="password" value={password} onChange={setPassword} hint="8+ characters" minLength={8} autoComplete="new-password" required />
        <FieldInput label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" required />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-soft mb-1">Country</label>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
          <option value="Zimbabwe">Zimbabwe</option>
          <option value="Botswana">Botswana</option>
          <option value="South Africa">South Africa</option>
          <option value="Zambia">Zambia</option>
          <option value="Malawi">Malawi</option>
          <option value="Mozambique">Mozambique</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-soft mb-1">Favorite Zimbabwean Club</label>
        <select value={favoriteClub} onChange={(e) => setFavoriteClub(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
          <option value="">Select a club (optional)</option>
          {ZIMBABWEAN_CLUBS.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted-soft mb-1">Platform</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
          {PLATFORMS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Phone (optional)" type="tel" value={phone} onChange={setPhone} hint="For account recovery" />
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Date of birth (optional)</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full apple-input px-3 py-2.5 text-ink text-sm"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 accent-accent"
          required
        />
        <span className="text-xs text-muted-soft leading-relaxed group-hover:text-ink transition-colors">
          I accept the <span className="text-accent">Terms of Service</span> and <span className="text-accent">Privacy Policy</span>. I confirm I am at least 13 years old.
        </span>
      </label>

      <button type="submit" disabled={pending} className="w-full rounded-[14px] cta-primary py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:transform-none">
        {pending ? "Creating account…" : "Create Your Account"}
      </button>
    </form>
  );
}

function FieldInput({ label, type = "text", value, onChange, hint, suffix, ...rest }: { label: string; type?: string; value: string; onChange: (v: string) => void; hint?: string; suffix?: React.ReactNode } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value">) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">{label}</span>
      <div className="relative">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm" {...rest} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
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