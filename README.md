# SingAlong Video Management System

Web-based application for managing a curated video library for live singalong events.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up database
```bash
# Option A: Use Docker for local PostgreSQL
docker compose up -d
# Wait a few seconds for Postgres to start

# Option B: Use Neon (free cloud PostgreSQL) - create at neon.tech, copy connection string to .env

# Push schema and seed
npm run db:push
npm run db:seed
```

### 3. Configure auth
Copy `.env.example` to `.env` and set:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_PASSWORD_HASH` - Generate with: `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"`
- `AUTH_SESSION_SECRET` - Random string for session cookies (optional in dev)

Default dev credentials: **admin** / **admin**

### 4. Run
```bash
npm run dev
```

Open http://localhost:3000

## Browsing the database

To inspect and edit data directly, use **Prisma Studio**:

```bash
npm run db:studio
```

This opens a browser UI at http://localhost:5555. You can view all tables, filter records, and edit data. The app uses your `DATABASE_URL` from `.env`, so ensure the database is running (e.g. `docker compose up -d`) beforehand.

### Database snapshots

Create full database backups and restore from them.

**Snapshot (backup):**
```bash
npm run db:snapshot
```
Saves to `backups/snapshot_YYYY-MM-DDTHH-MM-SS.sql` in the project root. Plain SQL (schema + data). The `backups/` folder is in `.gitignore` so snapshots are not committed.

**Restore:**
```bash
npm run db:restore -- backups/snapshot_2025-02-13T12-30-45.sql
```
Restore **overwrites all existing data** (drops and recreates tables). For production, prefer restoring to a staging DB first. If you omit the file path, the script lists available snapshots in `backups/`.

**Requires:** PostgreSQL client tools (`pg_dump`, `psql`) matching your server version (16.x). Mac: `brew install postgresql@16`. Linux: `apt install postgresql-client`. The scripts auto-detect Homebrew's `postgresql@16` when present.

Works with local (Docker) and production (Cloud SQL). For production, run from a machine that can connect to Cloud SQL (e.g. with [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy)) and `DATABASE_URL` pointing at the instance. Consider copying production snapshots to Cloud Storage for durable storage.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run db:generate` - Regenerate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed default genres
- `npm run db:studio` - Open Prisma Studio (browse database)
- `npm run db:snapshot` - Save full DB snapshot to `backups/snapshot_YYYY-MM-DDTHH-MM-SS.sql`
- `npm run db:restore -- backups/snapshot_xxx.sql` - Restore from a snapshot (overwrites existing data)

## Production (GCP)

### Docker
```bash
docker build -t singalong-mgmt .
docker run -p 3000:3000 -e DATABASE_URL="..." -e AUTH_PASSWORD_HASH="..." singalong-mgmt
```

### Cloud Run + Cloud SQL
1. Push image to Artifact Registry or Container Registry
2. Create Cloud SQL PostgreSQL instance
3. Deploy to Cloud Run with `DATABASE_URL`, `AUTH_PASSWORD_HASH`, `AUTH_SESSION_SECRET`
4. Optionally: `YOUTUBE_API_KEY` for real YouTube sync

### Environment variables (production)
- `DATABASE_URL` - Cloud SQL connection string
- `AUTH_PASSWORD_HASH` - bcrypt hash of password
- `AUTH_SESSION_SECRET` - Random string for session cookies
- `AUTH_USERNAME` - Login username
- `YOUTUBE_API_KEY` - (Optional) For real YouTube sync. Omit to use mock.
