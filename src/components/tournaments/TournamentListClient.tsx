"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SkeletonCard } from "@/components/ui/Skeleton";

type TournamentSummary = {
  id: string;
  name: string;
  type: string;
  status: string;
  city?: string | null;
  prizePool: number;
  entryFee: number;
  maxPlayers: number;
  playerCount: number;
  startAt?: string | null;
  createdAt: string;
  organizerName: string;
};

type TournamentFilters = {
  type?: string;
  status?: string;
  platform?: string;
  search?: string;
};

type TournamentListClientProps = {
  tournaments?: TournamentSummary[];
  onCreate?: () => void;
  filters?: TournamentFilters;
  onFilterChange?: (filters: TournamentFilters) => void;
  className?: string;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "text-muted-faint",
  REGISTRATION: "text-accent",
  LIVE: "text-gold",
  COMPLETED: "text-muted-soft",
};

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "KNOCKOUT", label: "Single Elim" },
  { value: "DOUBLE_ELIM", label: "Double Elim" },
  { value: "ROUND_ROBIN", label: "Round Robin" },
  { value: "GROUP_STAGE", label: "Group Stage" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "LIVE", label: "Live" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DRAFT", label: "Drafts" },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

function TrophyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M18 9h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" /><path d="M12 15v3" /><path d="M8 21h8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function TournamentListClient({
  tournaments = [],
  onCreate,
  filters = {},
  onFilterChange,
  className = "",
}: TournamentListClientProps) {
  const [search, setSearch] = useState(filters.search || "");
  const [typeFilter, setTypeFilter] = useState(filters.type || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "");
  const [loading, setLoading] = useState(false);

  const filtered = tournaments.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.name.toLowerCase().includes(q) &&
        !t.organizerName.toLowerCase().includes(q)
      )
        return false;
    }
    if (typeFilter && t.type !== typeFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    onFilterChange?.({ ...filters, search: val });
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    onFilterChange?.({ ...filters, type: val });
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    onFilterChange?.({ ...filters, status: val });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-black tracking-[0.28em] uppercase text-accent">Competitions</span>
          </div>
          <h1 className="cinematic-heading text-4xl sm:text-6xl text-ink leading-[0.88]">
            <span className="text-gradient-accent">Tournaments</span>
          </h1>
          <p className="mt-2 text-sm text-muted-soft">Compete, climb, conquer — ZW tournament circuit.</p>
        </div>
        {onCreate && (
          <button
            onClick={onCreate}
            className="shrink-0 h-11 px-5 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase cta-primary text-[#0D0D0F] flex items-center gap-2"
          >
            <PlusIcon />
            Create
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-faint pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tournaments..."
            className="apple-input w-full pl-11 pr-4 py-3 rounded-[16px] text-sm text-ink outline-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto bc-no-scrollbar">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="appearance-none px-3.5 h-9 rounded-[10px] text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: typeFilter ? "var(--accent)" : "var(--muted-soft)",
                paddingRight: "28px",
              }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FilterIcon />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="appearance-none px-3.5 h-9 rounded-[10px] text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: statusFilter ? "var(--gold)" : "var(--muted-soft)",
                paddingRight: "28px",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} rows={3} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="frosted-card p-12 text-center rounded-[24px]"
        >
          <TrophyIcon className="h-10 w-10 mx-auto mb-4 text-muted-faint" />
          <h3 className="bc-headline text-2xl text-muted-soft mb-2">No tournaments found</h3>
          <p className="text-[11px] font-bold tracking-[0.18em] text-muted-faint uppercase">
            {search || typeFilter || statusFilter
              ? "Try adjusting your filters"
              : "Be the first to create one"}
          </p>
          {!search && !typeFilter && !statusFilter && onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 mt-6 h-11 px-6 rounded-[14px] cta-primary text-[11px] font-bold tracking-[0.18em] uppercase text-[#0D0D0F]"
            >
              <PlusIcon />
              Create Tournament
            </button>
          )}
        </motion.div>
      )}

      {/* Tournament Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <Link
                  href={`/tournaments/${t.id}`}
                  className="block group h-full"
                >
                  <div
                    className="relative overflow-hidden rounded-[20px] p-5 h-full transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      background: "rgba(18,20,24,0.45)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          "radial-gradient(400px 200px at 50% 20%, rgba(0,255,133,0.04), transparent 70%)",
                      }}
                    />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[9px] font-black tracking-[0.2em] uppercase ${
                                STATUS_COLORS[t.status] ?? "text-muted-soft"
                              }`}
                            >
                              {t.status}
                            </span>
                            <span className="text-[9px] font-bold tracking-wider text-muted-faint uppercase">
                              {t.type === "KNOCKOUT"
                                ? "Single Elim"
                                : t.type === "DOUBLE_ELIM"
                                ? "Double Elim"
                                : t.type === "ROUND_ROBIN"
                                ? "Round Robin"
                                : t.type === "GROUP_STAGE"
                                ? "Group Stage"
                                : t.type}
                            </span>
                          </div>
                          <h3 className="cinematic-heading text-xl sm:text-2xl text-ink leading-none group-hover:text-accent transition-colors duration-200 truncate">
                            {t.name}
                          </h3>
                          <p className="text-[10px] text-muted-soft mt-1">
                            by {t.organizerName}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="cinematic-heading text-lg text-ink tabular-nums leading-none">
                            {t.playerCount}/{t.maxPlayers}
                          </p>
                          <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint mt-0.5">
                            Players
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-auto pt-3">
                        <span className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-accent/5 border border-accent/15 text-accent">
                          <TrophyIcon className="h-3 w-3" />
                          ${(t.prizePool / 100).toFixed(2)}
                        </span>
                        <span
                          className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider border text-muted-soft"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderColor: "rgba(255,255,255,0.06)",
                          }}
                        >
                          {t.entryFee > 0
                            ? `$${(t.entryFee / 100).toFixed(2)}`
                            : "Free"}
                        </span>
                        {t.startAt && (
                          <span className="text-[8px] text-muted-faint">
                            {new Date(t.startAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
