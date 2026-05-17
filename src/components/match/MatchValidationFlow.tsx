"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "score" | "screenshot" | "confirm" | "success";

type MatchValidationFlowProps = {
  matchId: string;
  onComplete: () => void;
  onCancel: () => void;
  className?: string;
};

const STEP_LABELS = ["Score Entry", "Screenshot", "Confirmation"];

export function MatchValidationFlow({ matchId, onComplete, onCancel, className = "" }: MatchValidationFlowProps) {
  const [step, setStep] = useState<Step>("score");
  const [myScore, setMyScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ["score", "screenshot", "confirm"];
  const currentIndex = steps.indexOf(step);

  const canProceedFromScore = myScore !== "" && oppScore !== "" && !isNaN(Number(myScore)) && !isNaN(Number(oppScore));

  const handleNext = () => {
    if (step === "score" && canProceedFromScore) setStep("screenshot");
    else if (step === "screenshot") setStep("confirm");
  };

  const handleBack = () => {
    if (step === "screenshot") setStep("score");
    else if (step === "confirm") setStep("screenshot");
    else onCancel();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setScreenshot(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/submit-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score1: Number(myScore),
          score2: Number(oppScore),
          screenshot: screenshot ? await toBase64(screenshot) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Submission failed");
      }
      setStep("success");
      setTimeout(() => onComplete(), 2500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
              i <= currentIndex
                ? "text-black"
                : "text-muted-soft"
            }`}
            style={{
              background: i <= currentIndex ? "var(--accent)" : "rgba(255,255,255,0.04)",
              border: i <= currentIndex ? "none" : "1px solid rgba(255,255,255,0.06)",
              boxShadow: i <= currentIndex ? "0 0 20px rgba(0,255,133,0.3)" : "none",
            }}
          >
            {i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-px w-8 sm:w-12 transition-all duration-300"
              style={{ background: i < currentIndex ? "var(--accent)" : "rgba(255,255,255,0.06)" }}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`${className}`}>
      {stepIndicator}

      <AnimatePresence mode="wait">
        {step === "score" && (
          <motion.div
            key="score"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="frosted-card p-5 sm:p-6 rounded-[20px]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent mb-4">Enter Score</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Your Score</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={myScore}
                  onChange={(e) => setMyScore(e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-[14px] text-lg font-bold text-ink text-center font-mono tabular-nums outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Opponent Score</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={oppScore}
                  onChange={(e) => setOppScore(e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-[14px] text-lg font-bold text-ink text-center font-mono tabular-nums outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 h-12 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-muted-soft transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceedFromScore}
                className="flex-1 h-12 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-black disabled:opacity-40 transition-all"
                style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.2)" }}
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === "screenshot" && (
          <motion.div
            key="screenshot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="frosted-card p-5 sm:p-6 rounded-[20px]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent mb-4">Screenshot (Optional)</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative rounded-[16px] border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver ? "border-accent bg-accent/5" : "border-border-faint hover:border-accent/30"
              }`}
              style={{ background: dragOver ? "rgba(0,255,133,0.03)" : "rgba(255,255,255,0.01)" }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              />
              {screenshot ? (
                <div className="space-y-2">
                  <span className="text-2xl block">📸</span>
                  <p className="text-sm font-bold text-accent">{screenshot.name}</p>
                  <p className="text-[10px] text-muted-faint">{(screenshot.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setScreenshot(null); }}
                    className="text-[10px] text-negative hover:text-negative/80 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 mx-auto text-muted-faint">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                  </svg>
                  <p className="text-sm text-muted-soft">Drop a screenshot here or click to browse</p>
                  <p className="text-[10px] text-muted-faint">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleBack} className="flex-1 h-12 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-muted-soft transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 h-12 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-black transition-all"
                style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.2)" }}
              >
                {screenshot ? "Skip" : "Skip"}
              </button>
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="frosted-card p-5 sm:p-6 rounded-[20px]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent mb-4">Confirm Result</p>
            <div className="rounded-[16px] p-4 mb-4 text-center" style={{ background: "rgba(0,255,133,0.04)", border: "1px solid rgba(0,255,133,0.12)" }}>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft mb-1">You</p>
                  <p className="cinematic-heading text-4xl text-accent tabular-nums">{myScore}</p>
                </div>
                <span className="text-2xl text-muted-faint font-light">:</span>
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-soft mb-1">Opponent</p>
                  <p className="cinematic-heading text-4xl text-ink tabular-nums">{oppScore}</p>
                </div>
              </div>
              {screenshot && (
                <p className="text-[10px] text-muted-soft mt-3 flex items-center justify-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 text-accent">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  {screenshot.name}
                </p>
              )}
            </div>
            {error && (
              <div className="rounded-[12px] px-3 py-2 text-xs text-negative mb-3" style={{ background: "rgba(255,77,77,0.08)" }}>
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleBack} disabled={submitting} className="flex-1 h-12 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-muted-soft transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-12 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-black disabled:opacity-50 transition-all"
                style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.2)" }}
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="frosted-card p-8 sm:p-10 rounded-[20px] text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--accent)", boxShadow: "0 0 40px rgba(0,255,133,0.3)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <h3 className="cinematic-heading text-2xl text-accent mb-2">Score Submitted!</h3>
            <p className="text-[11px] text-muted-soft">Waiting for opponent to verify the result</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
