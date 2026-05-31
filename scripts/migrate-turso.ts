/**
 * Phase 1a: Apply missing columns to production Turso DB
 * Run: TURSO_DATABASE_URL="..." TURSO_AUTH_TOKEN="..." USE_TURSO=true npx tsx scripts/migrate-turso.ts
 */
import { db } from "../src/lib/db";

const MIGRATIONS: { table: string; sql: string; verify: string }[] = [
  // users — missing from Turso vs Prisma schema
  {
    table: "users",
    sql: "ALTER TABLE users ADD COLUMN full_name TEXT",
    verify: "full_name",
  },
  {
    table: "users",
    sql: "ALTER TABLE users ADD COLUMN favorite_club TEXT",
    verify: "favorite_club",
  },
  {
    table: "users",
    sql: "ALTER TABLE users ADD COLUMN date_of_birth TEXT",
    verify: "date_of_birth",
  },
  {
    table: "users",
    sql: "ALTER TABLE users ADD COLUMN terms_accepted INTEGER DEFAULT 1",
    verify: "terms_accepted",
  },
  {
    table: "users",
    sql: "ALTER TABLE users ADD COLUMN terms_accepted_at TEXT",
    verify: "terms_accepted_at",
  },
  {
    table: "users",
    sql: "ALTER TABLE users ADD COLUMN is_fake INTEGER DEFAULT 0",
    verify: "is_fake",
  },
  // match_reports — missing updated_at
  {
    table: "match_reports",
    sql: "ALTER TABLE match_reports ADD COLUMN updated_at TEXT",
    verify: "updated_at",
  },
  // points_log — code expects reason_text (snake_case), Turso has reasonText (camelCase)
  // Add reason_text as an alias doesn't work in SQLite, so add the column
  {
    table: "points_log",
    sql: "ALTER TABLE points_log ADD COLUMN reason_text TEXT",
    verify: "reason_text",
  },
  // challenges — expires_at for 48hr challenge expiry
  {
    table: "challenges",
    sql: "ALTER TABLE challenges ADD COLUMN expires_at TEXT",
    verify: "expires_at",
  },
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const res = await db.execute({
    sql: "SELECT name FROM pragma_table_info(?) WHERE name = ?",
    args: [table, column],
  });
  return res.rows.length > 0;
}

async function main() {
  console.log("🔧 Turso Schema Migration\n");

  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const m of MIGRATIONS) {
    const exists = await columnExists(m.table, m.verify);
    if (exists) {
      console.log(`  ⏭  ${m.table}.${m.verify} — already exists, skipping`);
      skipped++;
      continue;
    }

    try {
      await db.execute(m.sql);
      console.log(`  ✓  ${m.table}.${m.verify} — added`);
      applied++;
    } catch (e: any) {
      console.error(`  ✗  ${m.table}.${m.verify} — FAILED: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${applied} applied, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
