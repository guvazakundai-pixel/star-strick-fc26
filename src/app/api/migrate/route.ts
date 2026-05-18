import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const TABLES = [
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, admin_id TEXT, action TEXT NOT NULL,
    target TEXT, details TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS club_fines (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL, amount REAL DEFAULT 0,
    reason TEXT, issued_by TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transfer_requests (
    id TEXT PRIMARY KEY, player_id TEXT NOT NULL,
    from_club_id TEXT, to_club_id TEXT,
    status TEXT DEFAULT 'PENDING', requested_by TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS player_contracts (
    id TEXT PRIMARY KEY, club_id TEXT, player_id TEXT NOT NULL,
    duration_months INTEGER DEFAULT 6, status TEXT DEFAULT 'ACTIVE',
    signed_at TEXT, expires_at TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS player_discipline (
    user_id TEXT PRIMARY KEY, strikes INTEGER DEFAULT 0,
    last_strike_at TEXT, reason TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS club_votes (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    title TEXT NOT NULL, options TEXT,
    created_by TEXT, ends_at TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hall_of_fame (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    club_id TEXT, title TEXT, achievement TEXT,
    inducted_by TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS club_alliances (
    id TEXT PRIMARY KEY, club1_id TEXT NOT NULL,
    club2_id TEXT NOT NULL, status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    UNIQUE(club1_id, club2_id)
  )`,
  `CREATE TABLE IF NOT EXISTS club_badges (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    badge_type TEXT NOT NULL, awarded_by TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS point_adjustments (
    id TEXT PRIMARY KEY, user_id TEXT, club_id TEXT,
    amount REAL NOT NULL, reason TEXT,
    issued_by TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS temp_admin_sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS automation_settings (
    club_id TEXT NOT NULL, setting_key TEXT NOT NULL,
    setting_value TEXT, updated_by TEXT, updated_at TEXT,
    PRIMARY KEY (club_id, setting_key)
  )`,
];

export const dynamic = "force-dynamic";

export async function GET() {
  const results: { table: string; ok: boolean; error?: string }[] = [];
  for (const sql of TABLES) {
    try {
      await db.execute({ sql });
      const name = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
      results.push({ table: name, ok: true });
    } catch (e) {
      const name = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
      results.push({ table: name, ok: false, error: String(e) });
    }
  }
  return NextResponse.json({ success: true, results });
}
