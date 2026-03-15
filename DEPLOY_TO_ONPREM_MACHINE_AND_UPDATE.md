# Deploy SingAlong Video Management on an On-Premises Windows Machine

This guide covers running the entire solution (app + database) on a Windows laptop or desktop. The client can host everything locally—no cloud required.

---

## Table of Contents

1. [First-Time On-Prem Deployment](#1-first-time-on-prem-deployment)
2. [Updating Database Schema and Code](#2-updating-database-schema-and-code)
3. [Resetting the Database to Factory Defaults](#3-resetting-the-database-to-factory-defaults)
4. [Taking Database Snapshots](#4-taking-database-snapshots)

---

## 1. First-Time On-Prem Deployment

### 1.1 Prerequisites

- **Windows 10 or 11** (or Windows Server)
- **Docker Desktop for Windows** — [Download](https://www.docker.com/products/docker-desktop/)
- **PowerShell** or **Command Prompt** (built into Windows)

### 1.2 Install Docker Desktop

1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).
2. Run the installer and follow the prompts.
3. Restart the computer if prompted.
4. Open Docker Desktop and ensure it says **Docker Desktop is running**.
5. Optional: In **Settings → General**, enable **Start Docker Desktop when you sign in** so the database and app can start automatically.

### 1.3 Copy the Project to the Client's Machine

Copy the entire project folder onto the Windows machine (e.g. `C:\SingAlongVideoMgmt` or the client's preferred location). You can:

- Copy from a USB drive, network share, or cloud folder, or
- Clone from Git: `git clone <repo-url> C:\SingAlongVideoMgmt`

Ensure these files and folders are present: `package.json`, `Dockerfile`, `prisma/`, `app/`, `lib/`, `public/`, `docker-compose.onprem.yml`, etc.

### 1.4 Create the `.env` File

In the project folder, create a file named `.env` (same folder as `package.json`). Use Notepad or any text editor. Add:

```env
POSTGRES_PASSWORD=your-secure-db-password
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=your-bcrypt-hash
AUTH_SESSION_SECRET=your-random-secret
```

You must generate `AUTH_PASSWORD_HASH` and `AUTH_SESSION_SECRET`:

1. Open PowerShell or Command Prompt.
2. Go to the project folder: `cd C:\SingAlongVideoMgmt` (use your actual path).
3. Generate the password hash (replace `your-admin-password` with the real password the client will use to log in):

   ```powershell
   node -e "console.log(require('bcryptjs').hashSync('your-admin-password', 10))"
   ```

   Copy the output and put it in `.env` as `AUTH_PASSWORD_HASH=` followed by that hash.

4. Generate a random session secret:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Copy the output and put it in `.env` as `AUTH_SESSION_SECRET=` followed by that value.

**Applying `.env` changes:** If you edit `.env` after the app is already running, a plain `restart` will **not** pick up the new values. Use:

```powershell
docker compose -f docker-compose.onprem.yml up -d --force-recreate app
```

**Example `.env`:**

```env
POSTGRES_PASSWORD=9227521
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=$2a$10$abcd1234...
AUTH_SESSION_SECRET=kX9mN2pQ...
```

**Without Node.js:** If Node.js is not installed, generate the hash and secret using Docker. Run these from the project folder (e.g. `cd C:\SingAlongVideoMgmt`).

Generate the password hash using the project’s script (avoids quoting issues in PowerShell and in the container). Replace `your-admin-password` with the real password; if it contains spaces, use quotes: `"PWD_TO_HASH=your password"`.

```powershell
docker run --rm -v "${PWD}:/app" -w /app -e PWD_TO_HASH=your-admin-password node:20-alpine sh -c "npm install bcryptjs && node scripts/hash-password.js"
```

For the session secret:

```powershell
docker run --rm node:20-alpine node -e 'console.log(require("crypto").randomBytes(32).toString("base64"))'
```

Alternatively, generate these on another machine with Node.js and copy the values into `.env`.

### 1.5 Start the Application

1. Open PowerShell or Command Prompt.
2. Navigate to the project folder:

   ```powershell
   cd C:\SingAlongVideoMgmt
   ```

3. Run:

   ```powershell
   docker compose -f docker-compose.onprem.yml up -d
   ```

   The first run will build the app image and start both the database and the app. This can take a few minutes.

4. Open a browser and go to **http://localhost:3000**.
5. Log in with the username and password you set in `AUTH_USERNAME` and `AUTH_PASSWORD_HASH`.

### 1.6 (Optional) Start Automatically When Windows Logs In

If you want the app to run whenever the user logs into Windows:

1. In Docker Desktop: **Settings → General** → enable **Start Docker Desktop when you sign in**.
2. Create a shortcut or scheduled task:

   **Option A: Startup folder shortcut**

   - Create a shortcut with target: `C:\Windows\System32\cmd.exe /c "cd /d C:\SingAlongVideoMgmt && docker compose -f docker-compose.onprem.yml up -d"`
   - Place it in the Startup folder: `Win+R` → `shell:startup` → paste the shortcut.

   **Option B: Task Scheduler**

   1. Open **Task Scheduler** (search in Start menu).
   2. **Create Task** → Name: `SingAlong Video Mgmt`.
   3. **Triggers** → **New** → Begin: **At log on** → OK.
   4. **Actions** → **New** → Program: `docker` → Arguments: `compose -f docker-compose.onprem.yml up -d` → Start in: `C:\SingAlongVideoMgmt` → OK.
   5. **Conditions** → uncheck **Start only if on AC power** (if using a laptop).
   6. **OK** to save.

### 1.7 (Optional) YouTube API and OAuth

For real YouTube sync instead of mock data:

1. Enable **YouTube Data API v3** in [Google Cloud Console](https://console.cloud.google.com/) and create an **API key** (and optionally **OAuth 2.0 credentials** for unlisted videos).
2. Add to `.env`:

   ```env
   YOUTUBE_API_KEY=your-api-key
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Recreate the app** so it picks up the new env vars (a plain *restart* does not reload `.env`):

   ```powershell
   docker compose -f docker-compose.onprem.yml up -d --force-recreate app
   ```

See [YouTube-Ready-Setup.md](./YouTube-Ready-Setup.md) for details.

### 1.8 Alternative: Run Without Docker for the App (Node.js + Docker DB)

If the client prefers to run the app directly with Node.js (and only use Docker for the database):

1. Install **Node.js 20 LTS** from [nodejs.org](https://nodejs.org/).
2. In the project folder:
   ```powershell
   npm install
   npm run build
   ```
3. Start only the database:
   ```powershell
   docker compose up -d
   ```
4. Add to `.env` (or create it):
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/singalong
   AUTH_USERNAME=admin
   AUTH_PASSWORD_HASH=your-bcrypt-hash
   AUTH_SESSION_SECRET=your-random-secret
   ```
5. Run schema and seed:
   ```powershell
   npm run db:push
   npm run db:seed
   ```
6. Start the app:
   ```powershell
   npm start
   ```
7. Open http://localhost:3000

Note: With this path, use `docker compose` (the default `docker-compose.yml` with `postgres:postgres`), not `docker-compose.onprem.yml`. For production, change `POSTGRES_PASSWORD` in the compose file to match your `.env`.

---

## 2. Updating Database Schema and Code

When you have new code or schema changes:

### 2.1 Get the Updated Files

Copy the updated project files over the existing ones, or pull from Git:

```powershell
cd C:\SingAlongVideoMgmt
git pull
```

(If you didn't use Git, replace the project folder with the new version.)

### 2.2 Rebuild and Restart (Docker path)

```powershell
docker compose -f docker-compose.onprem.yml down
docker compose -f docker-compose.onprem.yml build --no-cache
docker compose -f docker-compose.onprem.yml up -d
```

The `db push` and `db seed` run automatically when the app container starts (see `docker-compose.onprem.yml`). **Schema changes** (e.g. new columns on Video, Playlist) and new seed data are applied automatically—no extra steps needed.

### 2.3 Update (Node.js path)

If you're running the app with Node.js directly:

```powershell
npm install
npm run build
npm run db:push
npm run db:seed
```

Then restart the app (e.g. stop it with Ctrl+C and run `npm start` again).

---

## 3. Resetting the Database to Factory Defaults

"Factory defaults" means: empty app data plus default genres only.

### 3.1 Method A: Restore from a Factory Snapshot (Recommended)

**One-time: create the factory snapshot**

On any machine with a fresh database (e.g. `docker compose up -d` and `npm run db:push` + `npm run db:seed`):

```powershell
npm run db:snapshot
```

Copy the file from `backups/snapshot_*.sql` to the client's machine as `backups/factory-default.sql`.

**To reset the on-prem database:**

1. Ensure PostgreSQL client tools are available (see Section 4).
2. Set `DATABASE_URL` for the on-prem DB. With Docker, from the project folder:

   ```powershell
   $env:DATABASE_URL = "postgresql://postgres:your-postgres-password@localhost:5432/singalong"
   ```

   Use the same password as in `.env` (`POSTGRES_PASSWORD`).

3. Run:

   ```powershell
   npm run db:restore -- backups/factory-default.sql
   ```

4. Recreate the app so it picks up the clean DB:

   ```powershell
   docker compose -f docker-compose.onprem.yml up -d --force-recreate app
   ```

### 3.2 Method B: Drop Schema and Re-Push

If you don't have a factory snapshot:

1. Install PostgreSQL client tools (Section 4). Set `DATABASE_URL` as above.
2. Drop and recreate the schema:

   ```powershell
   psql $env:DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
   ```

3. Re-push schema and seed:

   ```powershell
   npm run db:push
   npm run db:seed
   ```

4. Restart the app.

---

## 4. Taking Database Snapshots

### 4.1 Prerequisites: PostgreSQL Client Tools on Windows

The `npm run db:snapshot` script needs `pg_dump` and `psql` on the system PATH.

**Option A: Install PostgreSQL for Windows**

1. Download the [PostgreSQL Windows installer](https://www.postgresql.org/download/windows/).
2. Run the installer. During setup, you can install only the **Command Line Tools** if you don't want a full database server.
3. Add PostgreSQL `bin` to PATH, e.g. `C:\Program Files\PostgreSQL\16\bin`.
4. Verify: open a new PowerShell and run `pg_dump --version`.

**Option B: Use Docker for pg_dump (no local install)**

If you prefer not to install PostgreSQL:

```powershell
# Find the database container name (e.g. singalongvideomgmt-db-1)
docker ps

# Create backups folder
mkdir -Force backups

# Run pg_dump inside the container
$timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
docker exec singalongvideomgmt-db-1 pg_dump -U postgres singalong --clean --if-exists -f /tmp/snapshot.sql
docker cp singalongvideomgmt-db-1:/tmp/snapshot.sql "backups/snapshot_$timestamp.sql"
```

Replace `singalongvideomgmt-db-1` with the actual container name from `docker ps` (the one running postgres).

### 4.2 Create a Snapshot

**With pg_dump on PATH:**

1. Set `DATABASE_URL` (use the same password as in `.env`):

   ```powershell
   $env:DATABASE_URL = "postgresql://postgres:your-postgres-password@localhost:5432/singalong"
   ```

2. Run:

   ```powershell
   npm run db:snapshot
   ```

The snapshot is saved to `backups/snapshot_YYYY-MM-DDTHH-MM-SS.sql`.

### 4.3 Restore from a Snapshot

```powershell
$env:DATABASE_URL = "postgresql://postgres:your-postgres-password@localhost:5432/singalong"
npm run db:restore -- backups/snapshot_2025-02-18T12-30-45.sql
```

**Warning:** Restore overwrites all existing data.

### 4.4 Restore Using Docker (if you don't have psql on PATH)

```powershell
Get-Content backups\snapshot_2025-02-18T12-30-45.sql | docker exec -i singalongvideomgmt-db-1 psql -U postgres singalong
```

Replace the container name and snapshot filename with yours.

---

## Summary Cheat Sheet

| Task | Command |
|------|---------|
| First deploy | `docker compose -f docker-compose.onprem.yml up -d` |
| Stop | `docker compose -f docker-compose.onprem.yml down` |
| Restart app | `docker compose -f docker-compose.onprem.yml restart app` |
| **Apply .env changes** | `docker compose -f docker-compose.onprem.yml up -d --force-recreate app` |
| Update code | Pull/copy files → `docker compose -f docker-compose.onprem.yml down` → `build --no-cache` → `up -d` |
| Reset DB to factory | Restore factory snapshot, or drop schema + `db:push` + `db:seed` |
| Take snapshot | Set `DATABASE_URL` → `npm run db:snapshot` (or use Docker `pg_dump` method) |
| Restore snapshot | `npm run db:restore -- backups/snapshot_xxx.sql` |
