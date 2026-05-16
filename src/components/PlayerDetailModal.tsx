"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PLAYERS, type Player } from "@/lib/players";
import { clubByPlayerId, type Club } from "@/lib/clubs";

/* ─── Type ─── */
export type ModalMode = "detail" | "select" | "compare";

/* ─── Helpers ─── */
function cityTag(city: string): string {
  const map: Record<string, string> = {
    Harare: "HAR", Bulawayo: "BUL", Mutare: "MUT", Gweru: "GWE",
    Kwekwe: "KWE", Masvingo: "MSV", Chitungwiza: "CHI", "Victoria Falls": "VFL",
  };
  return map[city] ?? city.slice(0, 3).toUpperCase();
}

function goalDiffIcon(val: number): string {
  if (val > 0) return "+";
  if (val < 0) return "";
  return "";
}

/* ─── Props ─── */
interface Props {
  player: Player;
  onClose: () => void;
  allPlayers?: Player[];              // for comparison selection
}

/* ─── COMPONENT ─── */
export function PlayerDetailModal({ player, onClose, allPlayers = PLAYERS }: Props) {
  const [mode, setMode] = useState<ModalMode>("detail");
  const [compareId, setCompareId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const club = useMemo(() => clubByPlayerId(player.id) ?? null, [player.id]);
  const comparePlayer = useMemo(
    () => (compareId ? allPlayers.find((p) => p.id === compareId) ?? null : null),
    [compareId, allPlayers],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleOverlay = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <div className="absolute inset-0 bg-bg/65 backdrop-blur-md" />

      <div
        className="relative z-10 w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-border-faint bg-bg-elevated/95 backdrop-blur-2xl shadow-2xl animate-in-up"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset" }}
      >
        {/* Drag handle (mobile) */}
        <div className="sticky top-0 z-20 flex items-center justify-center pt-3 pb-1 bg-bg-elevated/80 backdrop-blur-lg sm:hidden">
          <span className="h-1 w-10 rounded-full bg-border-strong" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 h-9 w-9 rounded-full grid place-items-center transition-all duration-200 hover:scale-110 bg-bg-highlight/60 hover:bg-bg-highlight border border-border-faint"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-ink-soft">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {mode === "detail" && !comparePlayer && (
          <DetailView
            player={player}
            club={club}
            onCompare={() => setMode("select")}
          />
        )}

        {mode === "select" && (
          <SelectPlayerView
            players={allPlayers}
            excludeId={player.id}
            onSelect={(id) => { setCompareId(id); setMode("compare"); }}
            onBack={() => setMode("detail")}
          />
        )}

        {mode === "compare" && comparePlayer && (
          <CompareView
            playerA={player}
            playerB={comparePlayer}
            clubA={club}
            clubB={clubByPlayerId(comparePlayer.id) ?? null}
            onBack={() => { setCompareId(null); setMode("detail"); }}
            onSwitch={() => {
              const prev = comparePlayer;
              setCompareId(null);
              setCompareId(player.id);
              // swap is handled by just passing different props — this triggers re-render
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DETAIL VIEW
   ═══════════════════════════════════════════════════════════ */
function DetailView({
  player,
  club,
  onCompare,
}: {
  player: Player;
  club: Club | null;
  onCompare: () => void;
}) {
  const stats = useMemo(() => {
    const total = player.wins + player.losses + player.draws;
    const winRate = total > 0 ? (player.wins / total) * 100 : 0;
    const gd = player.goalsFor - player.goalsAgainst;
    return { total, winRate, gd };
  }, [player]);

  return (
    <div className="px-5 sm:px-6 pb-6 sm:pb-8 pt-2">
      {/* Header: rank number + badges */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[10px] font-black tracking-[0.25em] text-accent uppercase">
            ACTIVE
          </span>
          <span className="h-3 w-px shrink-0 bg-border-strong" />
          <span className="text-[10px] font-bold tracking-[0.22em] text-muted-soft uppercase truncate max-w-[120px]">
            {player.division}
          </span>
          <span className="h-3 w-px shrink-0 bg-border-strong" />
          <span className="inline-flex items-center rounded-[3px] px-1.5 h-[18px] text-[8px] font-black tracking-[0.14em] uppercase border bg-accent/5 border-accent/20 text-accent shrink-0">
            {cityTag(player.city)}
          </span>
          <span className="inline-flex items-center rounded-[3px] px-1.5 h-[18px] text-[8px] font-black tracking-[0.14em] uppercase border bg-bg-highlight/60 border-border-strong text-muted-soft shrink-0">
            CROSSPLAY
          </span>
        </div>
        <span className="cinematic-heading text-4xl sm:text-5xl leading-none text-accent tabular-nums shrink-0">
          #{String(player.rank).padStart(2, "0")}
        </span>
      </div>

      {/* Avatar area */}
      <div className="flex items-end gap-4 mb-5">
        <div
          className="grid place-items-center h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-full border-2 shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
            borderColor: "rgba(0,255,133,0.30)",
            boxShadow: "0 0 40px -6px rgba(0,255,133,0.40)",
          }}
        >
          <span className="cinematic-heading text-3xl sm:text-4xl text-accent leading-none">
            {player.gamertag.charAt(0)}
          </span>
        </div>
        <div className="min-w-0 pb-1">
          <h2 className="cinematic-heading text-2xl sm:text-3xl text-ink leading-none truncate max-w-[240px] sm:max-w-[300px]">
            {player.gamertag}
          </h2>
          <p className="text-sm text-muted-soft truncate max-w-[240px] sm:max-w-[300px] mt-0.5">
            {player.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {club && (
              <span className="inline-flex items-center rounded-[3px] px-1.5 h-[18px] text-[8px] font-bold uppercase tracking-wider shrink-0 bg-accent/5 border border-accent/15 text-accent/70">
                {club.shortName}
              </span>
            )}
            <span className="font-mono text-[9px] tracking-wider text-muted-soft truncate max-w-[140px]">
              @{player.gamertag}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-px bg-border-faint rounded-[14px] overflow-hidden border border-border-faint mb-5">
        <StatBox label="Wins" value={player.wins} accent />
        <StatBox label="Draws" value={player.draws} />
        <StatBox label="Losses" value={player.losses} negative />
        <StatBox
          label="Win Rate"
          value={`${Math.round(stats.winRate)}%`}
          accent={stats.winRate >= 50}
        />
        <StatBox
          label="Goal Diff"
          value={`${goalDiffIcon(stats.gd)}${stats.gd}`}
          accent={stats.gd > 0}
          negative={stats.gd < 0}
        />
        <StatBox
          label="Streak"
          value={player.winStreak > 0 ? `${player.winStreak}W` : `${player.losses > 0 ? "L" : "—"}`}
          accent={player.winStreak >= 3}
        />
      </div>

      {/* Points row */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint">Points</p>
          <p className="cinematic-heading text-3xl text-ink tabular-nums leading-none mt-0.5">
            {player.points.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint">G/M</p>
          <p className="bc-mono-score text-xl text-ink tabular-nums leading-none mt-0.5">
            {player.gpm.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Form strip */}
      <div className="mb-5">
        <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint mb-2">
          Form
        </p>
        <div className="flex items-center gap-1.5">
          {player.form.map((r, i) => (
            <span
              key={i}
              className={`inline-grid place-items-center h-8 w-8 rounded-[8px] text-xs font-black italic ${
                r === "W"
                  ? "bg-accent/15 text-accent border border-accent/25"
                  : r === "L"
                    ? "bg-negative/12 text-negative border border-negative/20"
                    : "bg-bg-highlight text-muted-soft border border-border-faint"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Prize + hardware row */}
      <div className="grid grid-cols-2 gap-3 mb-5 px-3 py-3 rounded-[12px] bg-bg-highlight/40 border border-border-faint">
        <div className="min-w-0">
          <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint">Prize Pool</p>
          <p className="cinematic-heading text-xl text-ink tabular-nums leading-none mt-0.5 truncate">
            ${player.prizeMoney.toLocaleString()}
          </p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint">Rig</p>
          <p className="text-[11px] text-ink-soft leading-tight truncate">{player.hardware.console}</p>
          <p className="text-[9px] text-muted-soft truncate">{player.hardware.controller}</p>
        </div>
      </div>

      {/* Contact info */}
      {(player.whatsapp || player.phone) && (
        <div className="mb-5 px-3 py-3 rounded-[12px] bg-bg-highlight/40 border border-border-faint">
          <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint mb-2">
            Contact for Challenge
          </p>
          <div className="space-y-1.5">
            {player.whatsapp && (
              <a
                href={`https://wa.me/${player.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors duration-150 truncate"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="truncate">{player.whatsapp}</span>
              </a>
            )}
            {player.phone && (
              <a
                href={`tel:${player.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors duration-150 truncate"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                <span className="truncate">{player.phone}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* COMPARE button */}
      <button
        type="button"
        onClick={onCompare}
        className="w-full h-11 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase transition-all duration-200 flex items-center justify-center gap-2 bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 hover:border-accent/30 active:scale-[0.97]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M3 16v5h5" /><path d="M21 16v5h-5" />
          <path d="M21 21l-7-7" /><path d="M3 3l7 7" />
        </svg>
        Compare Player
      </button>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent = false,
  negative = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  negative?: boolean;
}) {
  const valCls = negative ? "text-negative" : accent ? "text-accent" : "text-ink";
  return (
    <div className="bg-bg/50 px-3 py-3 sm:px-4 sm:py-3.5 min-w-0">
      <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint truncate">
        {label}
      </p>
      <p className={`bc-mono-score text-lg sm:text-xl tabular-nums leading-none mt-0.5 truncate ${valCls}`}>
        {value}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SELECT PLAYER VIEW
   ═══════════════════════════════════════════════════════════ */
function SelectPlayerView({
  players,
  excludeId,
  onSelect,
  onBack,
}: {
  players: Player[];
  excludeId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      players
        .filter((p) => p.id !== excludeId)
        .filter((p) => {
          if (!query.trim()) return true;
          const q = query.toLowerCase();
          return (
            p.gamertag.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q)
          );
        })
        .slice(0, 30),
    [players, excludeId, query],
  );

  return (
    <div className="px-5 sm:px-6 pb-6 sm:pb-8 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="h-8 w-8 rounded-full grid place-items-center text-muted-soft hover:text-ink hover:bg-bg-highlight transition-all duration-200 shrink-0"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="cinematic-heading text-lg text-ink leading-none truncate">
          Select Player
        </h3>
      </div>

      {/* Search */}
      <label className="relative block mb-4">
        <span className="absolute inset-y-0 left-3 flex items-center text-muted-soft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          inputMode="search"
          placeholder="Search player or gamertag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 apple-input pl-9 pr-3 text-sm"
        />
      </label>

      {/* List */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto">
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-200 hover:bg-bg-highlight/60 group"
          >
            <div
              className="grid place-items-center h-9 w-9 rounded-[10px] shrink-0 border"
              style={{
                background: "linear-gradient(135deg, rgba(22,24,28,0.80), rgba(18,20,24,0.70))",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <span className="font-bold text-sm text-accent leading-none">
                {p.gamertag.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink truncate max-w-[200px] group-hover:text-accent transition-colors duration-200 uppercase">
                {p.gamertag}
              </p>
              <p className="text-[10px] text-muted-soft truncate max-w-[200px]">
                {p.name} · #{p.rank}
              </p>
              {(p.whatsapp || p.phone) && (
                <div className="flex items-center gap-2 mt-0.5">
                  {p.whatsapp && (
                    <span className="inline-flex items-center gap-1 text-[8px] text-accent/70 font-mono truncate max-w-[120px]">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5 shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span className="truncate">{p.whatsapp}</span>
                    </span>
                  )}
                  {p.phone && (
                    <span className="inline-flex items-center gap-1 text-[8px] text-muted-soft font-mono truncate max-w-[120px]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5 shrink-0">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                      <span className="truncate">{p.phone}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <span className="bc-mono-score text-sm tabular-nums text-ink-soft shrink-0">
              {p.points.toLocaleString()}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-soft text-sm py-8">No players found.</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPARISON VIEW
   ═══════════════════════════════════════════════════════════ */
function CompareView({
  playerA,
  playerB,
  clubA,
  clubB,
  onBack,
}: {
  playerA: Player;
  playerB: Player;
  clubA: Club | null;
  clubB: Club | null;
  onBack: () => void;
}) {
  const rows: { label: string; getVal: (p: Player) => string | number; higherBetter: boolean }[] = [
    { label: "Points", getVal: (p) => p.points.toLocaleString(), higherBetter: true },
    { label: "Wins", getVal: (p) => p.wins, higherBetter: true },
    { label: "Draws", getVal: (p) => p.draws, higherBetter: false },
    { label: "Losses", getVal: (p) => p.losses, higherBetter: false },
    { label: "Win Rate", getVal: (p) => { const t = p.wins + p.losses + p.draws; return t > 0 ? `${Math.round((p.wins / t) * 100)}%` : "—"; }, higherBetter: true },
    { label: "Goal Diff", getVal: (p) => { const gd = p.goalsFor - p.goalsAgainst; return `${gd >= 0 ? "+" : ""}${gd}`; }, higherBetter: true },
    { label: "G / Match", getVal: (p) => p.gpm.toFixed(2), higherBetter: true },
    { label: "Streak", getVal: (p) => p.winStreak > 0 ? `${p.winStreak}W` : "0", higherBetter: true },
    { label: "Goals For", getVal: (p) => p.goalsFor, higherBetter: true },
    { label: "Goals Against", getVal: (p) => p.goalsAgainst, higherBetter: false },
    { label: "Prize", getVal: (p) => `$${p.prizeMoney.toLocaleString()}`, higherBetter: true },
  ];

  return (
    <div className="px-5 sm:px-6 pb-6 sm:pb-8 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="h-8 w-8 rounded-full grid place-items-center text-muted-soft hover:text-ink hover:bg-bg-highlight transition-all duration-200 shrink-0"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="cinematic-heading text-lg text-ink leading-none truncate">
          Player Comparison
        </h3>
      </div>

      {/* Player labels */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-5">
        <div className="text-right min-w-0">
          <p className="cinematic-heading text-lg sm:text-xl text-ink leading-none truncate max-w-[140px] sm:max-w-[180px] ml-auto">
            {playerA.gamertag}
          </p>
          <p className="text-[9px] text-muted-soft truncate max-w-[140px] sm:max-w-[180px] ml-auto">
            {cityTag(playerA.city)} · #{playerA.rank}
            {clubA && <> · {clubA.shortName}</>}
          </p>
        </div>
        <div className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint shrink-0 px-2">
          VS
        </div>
        <div className="min-w-0">
          <p className="cinematic-heading text-lg sm:text-xl text-ink leading-none truncate max-w-[140px] sm:max-w-[180px]">
            {playerB.gamertag}
          </p>
          <p className="text-[9px] text-muted-soft truncate max-w-[140px] sm:max-w-[180px]">
            {cityTag(playerB.city)} · #{playerB.rank}
            {clubB && <> · {clubB.shortName}</>}
          </p>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="rounded-[14px] border border-border-faint overflow-hidden">
        {rows.map((r, i) => {
          const valA = r.getVal(playerA);
          const valB = r.getVal(playerB);
          const numA = typeof valA === "number" ? valA : parseFloat(String(valA).replace(/[$,%+]/g, ""));
          const numB = typeof valB === "number" ? valB : parseFloat(String(valB).replace(/[$,%+]/g, ""));
          const aWins = r.higherBetter ? numA > numB : numA < numB;
          const bWins = r.higherBetter ? numB > numA : numB < numA;
          const tie = numA === numB;

          return (
            <div
              key={r.label}
              className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 ${
                i < rows.length - 1 ? "border-b border-border-faint" : ""
              }`}
            >
              <div className={`text-right min-w-0 ${aWins ? "text-accent" : tie ? "text-ink" : "text-muted-soft"}`}>
                <span className={`bc-mono-score text-sm tabular-nums truncate block ${aWins ? "font-bold" : ""}`}
                  style={aWins ? { textShadow: "0 0 20px rgba(0,255,133,0.25)" } : undefined}
                >
                  {valA}
                  {aWins && !tie && <span className="ml-1 text-[8px]">◄</span>}
                </span>
              </div>
              <div className="text-[8px] font-black tracking-[0.18em] uppercase text-muted-faint text-center shrink-0 min-w-[40px]">
                {r.label}
              </div>
              <div className={`min-w-0 ${bWins ? "text-accent" : tie ? "text-ink" : "text-muted-soft"}`}>
                <span className={`bc-mono-score text-sm tabular-nums truncate block ${bWins ? "font-bold" : ""}`}
                  style={bWins ? { textShadow: "0 0 20px rgba(0,255,133,0.25)" } : undefined}
                >
                  {!tie && bWins && <span className="mr-1 text-[8px]">►</span>}
                  {valB}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
