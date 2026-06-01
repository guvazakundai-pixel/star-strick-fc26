// Migration: Challenge System Redesign
// Adds async verification fields to challenges + creates match_results table
import { db } from "../src/lib/db";
import crypto from "crypto";

async function migrate() {
  console.log("[Migration] Starting challenge system redesign migration...");

  // 1. Add new columns to challenges table (SQLite ALTER TABLE — one at a time)
  const challengeCols = [
    { name: "platform", type: "TEXT" },
    { name: "game_mode", type: "TEXT" },
    { name: "message", type: "TEXT" },
  ];

  for (const col of challengeCols) {
    try {
      await db.execute({
        sql: `ALTER TABLE challenges ADD COLUMN ${col.name} ${col.type}`,
        args: [],
      });
      console.log(`[Migration] Added challenges.${col.name}`);
    } catch (e: any) {
      if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
        console.log(`[Migration] Column challenges.${col.name} already exists, skipping`);
      } else {
        throw e;
      }
    }
  }

  // 2. Create match_results table
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS match_results (
      id TEXT PRIMARY KEY NOT NULL,
      challenge_id TEXT UNIQUE NOT NULL,
      submitted_by TEXT NOT NULL,
      challenger_score INTEGER NOT NULL DEFAULT 0,
      opponent_score INTEGER NOT NULL DEFAULT 0,
      screenshot_url TEXT,
      notes TEXT,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      counter_submitted_by TEXT,
      counter_challenger_score INTEGER,
      counter_opponent_score INTEGER,
      counter_screenshot_url TEXT,
      counter_notes TEXT,
      counter_submitted_at TEXT,
      final_challenger_score INTEGER,
      final_opponent_score INTEGER,
      resolved_by TEXT,
      resolved_at TEXT,
      dispute_reason TEXT,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
      FOREIGN KEY (submitted_by) REFERENCES users(id),
      FOREIGN KEY (counter_submitted_by) REFERENCES users(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    )`,
    args: [],
  });
  console.log("[Migration] Created match_results table");

  // 3. Update existing challenge statuses to new enum values
  // Old: pending, accepted, awaiting_confirmation, completed, disputed, cancelled, expired
  // New: PENDING_ACCEPTANCE, MATCH_READY, AWAITING_VERIFICATION, VERIFIED, DISPUTED, ADMIN_REVIEW, RESOLVED, CANCELLED, EXPIRED

  const statusMap: Record<string, string> = {
    "pending": "PENDING_ACCEPTANCE",
    "accepted": "MATCH_READY",
    "awaiting_confirmation": "AWAITING_VERIFICATION",
    "completed": "VERIFIED",
    "disputed": "DISPUTED",
    "cancelled": "CANCELLED",
    "expired": "EXPIRED",
  };

  for (const [oldStatus, newStatus] of Object.entries(statusMap)) {
    const result = await db.execute({
      sql: `UPDATE challenges SET status = ? WHERE status = ?`,
      args: [newStatus, oldStatus],
    });
    if (result.rowsAffected && result.rowsAffected > 0) {
      console.log(`[Migration] Updated ${result.rowsAffected} challenges: ${oldStatus} → ${newStatus}`);
    }
  }

  console.log("[Migration] Challenge system redesign migration complete.");
}

migrate()
  .then(() => {
    console.log("[Migration] Done.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("[Migration] Failed:", e);
    process.exit(1);
  });
