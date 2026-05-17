"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type HealthMetric = {
  id: string;
  metric: string;
  value: number;
  label: string;
  updatedAt: string;
};

type Stats = {
  userCount: number;
  clubCount: number;
  matchCount: number;
  disputeCount: number;
  tournamentCount: number;
  leagueCount: number;
};

export function AdminSettingsClient({
  activeTab,
  healthMetrics,
  stats,
}: {
  activeTab: string;
  healthMetrics: HealthMetric[];
  stats: Stats;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [platform, setPlatform] = useState({
    siteName: "ZIM FCPRO",
    siteDescription: "Zimbabwe's Premier EA FC League Platform",
    maintenanceMode: false,
  });

  const [pointsConfig, setPointsConfig] = useState({
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
  });

  const [rankingConfig, setRankingConfig] = useState({
    eloKFactor: 32,
    formWeight: 0.3,
    decayEnabled: true,
    decayDays: 30,
  });

  const [socialLinks, setSocialLinks] = useState({
    discord: "",
    twitter: "",
    instagram: "",
    whatsapp: "",
  });

  const [dirty, setDirty] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setMessage(null);

      const payload: Record<string, unknown> = {};
      if (activeTab === "platform") payload.platform = platform;
      else if (activeTab === "points") payload.pointsConfig = pointsConfig;
      else if (activeTab === "ranking") payload.rankingConfig = rankingConfig;
      else if (activeTab === "social") payload.socialLinks = socialLinks;

      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tab: activeTab, ...payload }),
        });
        if (res.ok) {
          setMessage({ type: "success", text: "Settings saved." });
          setDirty(false);
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setMessage({ type: "error", text: data.error || "Save failed." });
        }
      } catch {
        setMessage({ type: "error", text: "Network error." });
      } finally {
        setBusy(false);
      }
    },
    [activeTab, platform, pointsConfig, rankingConfig, socialLinks, router],
  );

  const handleReset = useCallback(() => {
    if (activeTab === "platform") {
      setPlatform({ siteName: "ZIM FCPRO", siteDescription: "", maintenanceMode: false });
    } else if (activeTab === "points") {
      setPointsConfig({ winPoints: 3, drawPoints: 1, lossPoints: 0 });
    } else if (activeTab === "ranking") {
      setRankingConfig({ eloKFactor: 32, formWeight: 0.3, decayEnabled: true, decayDays: 30 });
    } else if (activeTab === "social") {
      setSocialLinks({ discord: "", twitter: "", instagram: "", whatsapp: "" });
    }
    setDirty(true);
  }, [activeTab]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <form onSubmit={handleSave} className="space-y-5">
          {activeTab === "platform" && (
            <div className="frosted-card p-5 rounded-[24px] space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-soft">
                Platform Identity
              </h3>
              <Field label="Site Name">
                <input
                  value={platform.siteName}
                  onChange={(e) => {
                    setPlatform((p) => ({ ...p, siteName: e.target.value }));
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
                />
              </Field>
              <Field label="Site Description">
                <textarea
                  value={platform.siteDescription}
                  onChange={(e) => {
                    setPlatform((p) => ({ ...p, siteDescription: e.target.value }));
                    markDirty();
                  }}
                  rows={2}
                  className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 resize-none transition-colors"
                />
              </Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={platform.maintenanceMode}
                  onClick={() => {
                    setPlatform((p) => ({ ...p, maintenanceMode: !p.maintenanceMode }));
                    markDirty();
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    platform.maintenanceMode ? "bg-negative" : "bg-bg-highlight"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      platform.maintenanceMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-ink">Maintenance Mode</span>
              </label>
              {platform.maintenanceMode && (
                <p className="text-xs text-negative">
                  Users will see a maintenance page. Only admins can access the platform.
                </p>
              )}
            </div>
          )}

          {activeTab === "points" && (
            <div className="frosted-card p-5 rounded-[24px] space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-soft">
                Points Configuration
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Win">
                  <input
                    type="number"
                    min={0}
                    value={pointsConfig.winPoints}
                    onChange={(e) => {
                      setPointsConfig((p) => ({ ...p, winPoints: parseInt(e.target.value) || 0 }));
                      markDirty();
                    }}
                    className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
                  />
                </Field>
                <Field label="Draw">
                  <input
                    type="number"
                    min={0}
                    value={pointsConfig.drawPoints}
                    onChange={(e) => {
                      setPointsConfig((p) => ({ ...p, drawPoints: parseInt(e.target.value) || 0 }));
                      markDirty();
                    }}
                    className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
                  />
                </Field>
                <Field label="Loss">
                  <input
                    type="number"
                    min={0}
                    value={pointsConfig.lossPoints}
                    onChange={(e) => {
                      setPointsConfig((p) => ({ ...p, lossPoints: parseInt(e.target.value) || 0 }));
                      markDirty();
                    }}
                    className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
                  />
                </Field>
              </div>
            </div>
          )}

          {activeTab === "ranking" && (
            <div className="frosted-card p-5 rounded-[24px] space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-soft">
                Ranking Configuration
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ELO K-Factor">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={rankingConfig.eloKFactor}
                    onChange={(e) => {
                      setRankingConfig((p) => ({
                        ...p,
                        eloKFactor: parseInt(e.target.value) || 32,
                      }));
                      markDirty();
                    }}
                    className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
                  />
                </Field>
                <Field label="Form Weight">
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={rankingConfig.formWeight}
                    onChange={(e) => {
                      setRankingConfig((p) => ({
                        ...p,
                        formWeight: parseFloat(e.target.value) || 0,
                      }));
                      markDirty();
                    }}
                    className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={rankingConfig.decayEnabled}
                  onClick={() => {
                    setRankingConfig((p) => ({ ...p, decayEnabled: !p.decayEnabled }));
                    markDirty();
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    rankingConfig.decayEnabled ? "bg-accent" : "bg-bg-highlight"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      rankingConfig.decayEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-ink">Ranking Decay</span>
              </label>
              {rankingConfig.decayEnabled && (
                <Field label="Decay Period (days)">
                  <input
                    type="number"
                    min={1}
                    value={rankingConfig.decayDays}
                    onChange={(e) => {
                      setRankingConfig((p) => ({
                        ...p,
                        decayDays: parseInt(e.target.value) || 30,
                      }));
                      markDirty();
                    }}
                    className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
                  />
                </Field>
              )}
            </div>
          )}

          {activeTab === "social" && (
            <div className="frosted-card p-5 rounded-[24px] space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-soft">
                Social Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { key: "discord", label: "Discord", icon: "M9 12h6M12 9v6" },
                    { key: "twitter", label: "Twitter / X", icon: "M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M19.5 4L12.5 12" },
                    { key: "instagram", label: "Instagram", icon: "M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Z" },
                    { key: "whatsapp", label: "WhatsApp", icon: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" },
                  ] as const
                ).map(({ key, label, icon }) => (
                  <Field key={key} label={label}>
                    <div className="relative">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-faint"
                      >
                        <path d={icon} />
                      </svg>
                      <input
                        type="url"
                        placeholder={`https://${key}.com/...`}
                        value={socialLinks[key as keyof typeof socialLinks]}
                        onChange={(e) => {
                          setSocialLinks((p) => ({ ...p, [key]: e.target.value }));
                          markDirty();
                        }}
                        className="w-full rounded-lg border border-border-faint bg-bg-highlight/40 pl-9 pr-3 py-2.5 text-sm text-ink outline-none focus:border-accent/30 transition-colors"
                      />
                    </div>
                  </Field>
                ))}
              </div>
            </div>
          )}

          {activeTab === "health" && (
            <div className="space-y-4">
              <div className="frosted-card p-5 rounded-[24px]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-soft mb-4">
                  System Health Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {healthMetrics.map((m) => (
                    <div key={m.id} className="glass-v2-sm rounded-[16px] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-faint">
                        {m.label || m.metric}
                      </p>
                      <p className="text-2xl font-black text-ink mt-1">
                        {m.value.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-muted-faint mt-1">
                        Updated {new Date(m.updatedAt).toLocaleDateString("en-ZW")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="frosted-card p-5 rounded-[24px]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-soft mb-4">
                  Aggregate Stats
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Users", value: stats.userCount, color: "text-accent" },
                    { label: "Clubs", value: stats.clubCount, color: "text-gold" },
                    { label: "Matches", value: stats.matchCount, color: "text-blue-400" },
                    { label: "Disputes", value: stats.disputeCount, color: "text-negative" },
                    { label: "Tournaments", value: stats.tournamentCount, color: "text-purple-400" },
                    { label: "Leagues", value: stats.leagueCount, color: "text-emerald-400" },
                  ].map((s) => (
                    <div key={s.label} className="frosted-card-sm p-3 text-center">
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] font-mono text-muted-faint uppercase tracking-wider">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab !== "health" && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-4 rounded-[12px] border border-border-faint text-muted-soft text-[10px] font-bold uppercase tracking-wider hover:text-ink hover:border-accent/20 transition-all"
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                disabled={busy || !dirty}
                className="h-10 px-5 rounded-[12px] bg-accent text-black text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-40"
              >
                {busy ? "Saving..." : "Save Settings"}
              </button>
            </div>
          )}

          {message && (
            <div
              className={`rounded-[12px] border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-accent/30 bg-accent/8 text-accent"
                  : "border-negative/30 bg-negative/8 text-negative"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-soft mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
