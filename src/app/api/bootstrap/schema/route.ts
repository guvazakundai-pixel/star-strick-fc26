import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const TABLES = [
  `CREATE TABLE IF NOT EXISTS club_members (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL, user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER', title TEXT,
    permissions TEXT DEFAULT '{}', joined_at TEXT NOT NULL,
    xp INTEGER DEFAULT 0, status TEXT DEFAULT 'ACTIVE',
    UNIQUE(club_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS club_applications (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL, user_id TEXT NOT NULL,
    message TEXT, status TEXT DEFAULT 'PENDING',
    preferred_role TEXT, created_at TEXT NOT NULL,
    reviewed_by TEXT, reviewed_at TEXT,
    UNIQUE(club_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS club_invites (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL, sender_id TEXT NOT NULL,
    invitee_id TEXT NOT NULL, status TEXT DEFAULT 'PENDING',
    message TEXT, created_at TEXT NOT NULL,
    UNIQUE(club_id, invitee_id)
  )`,
  `CREATE TABLE IF NOT EXISTS club_rivalries (
    id TEXT PRIMARY KEY, club1_id TEXT NOT NULL, club2_id TEXT NOT NULL,
    club1_wins INTEGER DEFAULT 0, club2_wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0, streak_club TEXT,
    rivalry_score REAL DEFAULT 0, featured INTEGER DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    UNIQUE(club1_id, club2_id)
  )`,
  `CREATE TABLE IF NOT EXISTS club_seasons (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    season_number INTEGER NOT NULL, name TEXT,
    status TEXT DEFAULT 'ACTIVE',
    started_at TEXT NOT NULL, ended_at TEXT,
    trophies INTEGER DEFAULT 0, mvp_id TEXT,
    records TEXT DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS club_tournaments (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    name TEXT NOT NULL, format TEXT DEFAULT 'KNOCKOUT',
    status TEXT DEFAULT 'DRAFT', max_participants INTEGER DEFAULT 16,
    winner_id TEXT, mvp_id TEXT,
    bracket TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS club_internal_leagues (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    name TEXT NOT NULL, status TEXT DEFAULT 'DRAFT',
    season_duration INTEGER DEFAULT 30,
    max_players INTEGER DEFAULT 20,
    points_system TEXT DEFAULT '3-1-0',
    has_promotion INTEGER DEFAULT 0,
    has_relegation INTEGER DEFAULT 0,
    created_at TEXT NOT NULL, started_at TEXT, ended_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS club_training_sessions (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    title TEXT NOT NULL, type TEXT DEFAULT 'TRAINING',
    scheduled_at TEXT NOT NULL,
    duration INTEGER DEFAULT 60,
    created_by TEXT, status TEXT DEFAULT 'SCHEDULED',
    notes TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS club_announcements (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    author_id TEXT NOT NULL, title TEXT NOT NULL,
    content TEXT NOT NULL, pinned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS club_moderation_logs (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    action TEXT NOT NULL, target_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL, reason TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS free_agents (
    id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE', preferred_role TEXT,
    preferred_playstyle TEXT, description TEXT,
    availability TEXT, created_at TEXT NOT NULL,
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS club_notifications (
    id TEXT PRIMARY KEY, club_id TEXT NOT NULL,
    user_id TEXT, type TEXT NOT NULL,
    title TEXT NOT NULL, message TEXT,
    is_read INTEGER DEFAULT 0, created_at TEXT NOT NULL
  )`,
];

export async function GET() {
  const results: { table: string; ok: boolean; error?: string }[] = [];
  for (const sql of TABLES) {
    try {
      await db.execute({ sql });
      const name = sql.match(/club_\w+/)?.[0] ?? "unknown";
      results.push({ table: name, ok: true });
    } catch (e) {
      const name = sql.match(/club_\w+/)?.[0] ?? "unknown";
      results.push({ table: name, ok: false, error: String(e) });
    }
  }
  return NextResponse.json({ success: true, results });
}
