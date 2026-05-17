"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

type ModelInfo = { name: string; count: number };
type ModelGroup = { group: string; models: ModelInfo[] };
type EnvCheck = { key: string; set: boolean; inVercel: boolean };
type TowerData = {
  status: "healthy" | "degraded";
  timestamp: string;
  db: { latency: number; totalModels: number; resolvedModels: number; failedModels: number };
  env: EnvCheck[];
  platform: { node: string; runtime: string; region: string; vercelEnv: string };
  groups: ModelGroup[];
  errors?: string[];
};

export default function ControlTower() {
  const [data, setData] = useState<TowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/control-tower");
      if (!res.ok) { setError(`API returned ${res.status}`); return; }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-muted-soft font-mono">Booting control tower...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="frosted-card-sm p-8 text-center max-w-md">
          <div className="h-12 w-12 rounded-full bg-negative/10 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-negative"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          </div>
          <p className="text-ink font-bold mb-2">Connection Lost</p>
          <p className="text-sm text-muted-soft mb-4 font-mono">{error}</p>
          <button onClick={fetchData} className="btn-primary inline-flex items-center justify-center h-10 px-5 rounded-[12px] text-xs font-bold">Reconnect</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Control Tower</h1>
          <p className="text-sm text-muted-soft mt-1">Developer operations dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={data.status} />
          <button onClick={fetchData} className="h-9 w-9 rounded-[10px] border border-border-faint bg-bg-elevated/50 flex items-center justify-center hover:border-accent/20 transition-colors" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-muted-soft"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="DB Latency" value={`${data.db.latency}ms`} sub={`${data.db.resolvedModels}/${data.db.totalModels} models`} tone={data.db.latency < 1000 ? "accent" : "gold"} />
        <MetricCard label="Runtime" value={data.platform.runtime} sub={`Node ${data.platform.node}`} tone="accent" />
        <MetricCard label="Region" value={data.platform.region} sub={data.platform.vercelEnv} tone="accent" />
        <MetricCard label="Errors" value={String(data.db.failedModels)} sub={data.errors ? `${data.errors.length} issues` : "All clear"} tone={data.db.failedModels > 0 ? "danger" : "accent"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="frosted-card p-5 rounded-[22px]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-4">Database Models</h3>
          <div className="space-y-1">
            {data.groups.map((g) => (
              <div key={g.group}>
                <button
                  onClick={() => setExpandedGroup(expandedGroup === g.group ? null : g.group)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[10px] hover:bg-bg-highlight/50 transition-colors"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink">{g.group}</span>
                  <span className="text-[10px] font-mono text-muted-faint">{g.models.length} tables</span>
                </button>
                {expandedGroup === g.group && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden pl-4"
                  >
                    {g.models.map((m) => (
                      <div key={m.name} className="flex items-center justify-between px-3 py-1.5 rounded-[8px] text-[12px]">
                        <span className="text-muted-soft font-mono">{m.name}</span>
                        <span className={`font-mono tabular-nums ${m.count >= 0 ? "text-ink" : "text-negative"}`}>
                          {m.count >= 0 ? m.count.toLocaleString() : "ERR"}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="frosted-card p-5 rounded-[22px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-4">Environment</h3>
            <div className="space-y-2">
              {data.env.map((e) => (
                <div key={e.key} className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-bg-highlight/30">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${e.set ? "bg-accent" : "bg-negative"}`} />
                    <span className="text-xs font-mono text-muted-soft">{e.key}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${e.set ? "text-accent" : "text-negative"}`}>
                    {e.set ? "set" : "missing"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {data.errors && (
            <div className="frosted-card p-5 rounded-[22px] border border-negative/20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-negative mb-3">Errors</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {data.errors.map((err, i) => (
                  <div key={i} className="px-3 py-2 rounded-[8px] bg-negative/5 text-xs font-mono text-negative/80 break-all">
                    {err}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="frosted-card p-5 rounded-[22px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton label="Prisma Studio" href="/admin" desc="Browse data" />
              <ActionButton label="API Health" href="/api/health" desc="Ping endpoint" />
              <ActionButton label="Recompute Ranks" href="/admin/rankings" desc="Recalculate" />
              <ActionButton label="Settings" href="/admin/settings" desc="Configuration" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-[9px] font-mono text-muted-faint">
          Last updated: {new Date(data.timestamp).toLocaleString()} &middot; ZIM FCPRO Control Tower v1
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "healthy";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${ok ? "bg-accent/10 text-accent" : "bg-negative/10 text-negative"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-accent live-ring" : "bg-negative"}`} />
      {status}
    </span>
  );
}

function MetricCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  const colors: Record<string, string> = { accent: "text-accent", gold: "text-gold", danger: "text-negative" };
  return (
    <div className="frosted-card-sm p-4 rounded-[16px]">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-faint">{label}</p>
      <p className={`text-xl font-black mt-0.5 tabular-nums ${colors[tone] || "text-ink"}`}>{value}</p>
      <p className="text-[10px] text-muted-soft mt-0.5 font-mono">{sub}</p>
    </div>
  );
}

function ActionButton({ label, href, desc }: { label: string; href: string; desc: string }) {
  return (
    <a href={href} className="block px-3 py-2.5 rounded-[12px] border border-border-faint hover:border-accent/20 hover:bg-accent/5 transition-all duration-200 group">
      <p className="text-xs font-bold text-ink group-hover:text-accent transition-colors">{label}</p>
      <p className="text-[9px] text-muted-faint font-mono">{desc}</p>
    </a>
  );
}
