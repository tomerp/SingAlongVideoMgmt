#!/usr/bin/env node
/**
 * Database snapshot - exports full DB to backups/snapshot_YYYY-MM-DDTHH-MM-SS.sql
 * Works with local (Docker) and production (Cloud SQL) via DATABASE_URL.
 * Requires: PostgreSQL client tools (pg_dump) - brew install postgresql@16 (Mac) or apt install postgresql-client (Linux)
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(process.cwd(), ".env") });

// Prefer postgresql@16 to match Docker; keg-only formulas aren't on default PATH
const PG16_BINS = [
  "/opt/homebrew/opt/postgresql@16/bin",
  "/usr/local/opt/postgresql@16/bin",
].find((p) => fs.existsSync(p));
const env = PG16_BINS
  ? { ...process.env, PATH: `${PG16_BINS}:${process.env.PATH}` }
  : process.env;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Error: DATABASE_URL not set. Add it to .env");
  process.exit(1);
}

const backupDir = path.join(process.cwd(), "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const file = path.join(backupDir, `snapshot_${timestamp}.sql`);

try {
  execFileSync("pg_dump", ["--clean", "--if-exists", "-f", file, url], {
    stdio: "inherit",
    env,
  });
} catch (e) {
  if (e.message?.includes("spawn pg_dump") || e.code === "ENOENT") {
    console.error(
      "Error: pg_dump not found. Install PostgreSQL client tools:\n  Mac: brew install postgresql\n  Linux: apt install postgresql-client"
    );
  }
  process.exit(1);
}

console.log(`Snapshot saved to ${file}`);
