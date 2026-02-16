#!/usr/bin/env node
/**
 * Database restore - restores from a snapshot file.
 * Usage: npm run db:restore -- backups/snapshot_2025-02-13T12-30-45.sql
 * Works with local (Docker) and production (Cloud SQL) via DATABASE_URL.
 * Requires: PostgreSQL client tools (psql) - brew install postgresql@16 (Mac) or apt install postgresql-client (Linux)
 *
 * WARNING: Restore overwrites existing data. For production, prefer restoring to a staging DB first.
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

// Accept file path from argv: npm run db:restore -- backups/snapshot_xxx.sql
const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: npm run db:restore -- <path-to-snapshot.sql>");
  console.error("Example: npm run db:restore -- backups/snapshot_2025-02-13T12-30-45.sql");
  const backupDir = path.join(process.cwd(), "backups");
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".sql"));
    if (files.length) {
      console.error("\nAvailable snapshots in backups/:");
      files.sort().reverse().slice(0, 5).forEach((f) => console.error(`  ${f}`));
    }
  }
  process.exit(1);
}

const filePath = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

try {
  execFileSync("psql", [url, "-f", filePath], { stdio: "inherit", env });
  console.log("Restore complete.");
} catch (e) {
  if (e.message?.includes("spawn psql") || e.code === "ENOENT") {
    console.error(
      "Error: psql not found. Install PostgreSQL client tools:\n  Mac: brew install postgresql\n  Linux: apt install postgresql-client"
    );
  }
  process.exit(1);
}
