# Deploy SingAlong Video Management to GCP

This guide covers deploying the entire solution to Google Cloud Platform (Cloud Run + Cloud SQL) and maintaining it over time.

---

## Estimated Monthly Cost

Rough estimate for **light usage** (user logs in ~2×/week for ~1 hour each, syncs once/month):

| Service            | Est. monthly cost | Notes |
|--------------------|-------------------|-------|
| Cloud Run          | **$0**            | Scales to zero; 2M requests & 180k vCPU-sec free. Your usage is well under the free tier. |
| Cloud SQL          | **~$10–12**       | db-f1-micro (0.6 GB) runs 24/7. Instance ~$9 + 10 GB storage ~$1.70. Main cost. |
| Artifact Registry  | **$0–0.10**       | ~0.5 GB for Docker images; often within free tier. |
| Secret Manager     | **$0**            | First 6 secret versions free; 3 secrets used. |
| Cloud Storage      | **$0**            | Optional for backups; negligible for a few snapshots. |

**Total: ~$10–15/month** in this scenario. Cloud SQL is the main cost. Prices are approximate for us-central1; see [GCP Pricing Calculator](https://cloud.google.com/products/calculator) for current rates.

---

## Table of Contents

1. [First-Time GCP Deployment](#1-first-time-gcp-deployment)
2. [Updating Database Schema and Code](#2-updating-database-schema-and-code)
3. [Resetting the Database to Factory Defaults](#3-resetting-the-database-to-factory-defaults)
4. [Taking Database Snapshots](#4-taking-database-snapshots)

---

## 1. First-Time GCP Deployment

This section walks through deploying the SingAlong app to GCP from scratch.

### 1.1 Prerequisites

- A Google account with billing enabled
- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed locally
- [Docker](https://docs.docker.com/get-docker/) installed (for building images)
- PostgreSQL client tools (`pg_dump`, `psql`) for snapshots—optional for first deploy. Mac: `brew install postgresql@16`; Linux: `apt install postgresql-client`

### 1.2 Create a GCP Project

```bash
# Log in to gcloud
gcloud auth login

# Set your chosen project ID, then create the project (or use an existing one)
export PROJECT_ID="singalong-mgmt"   # or your preferred ID
gcloud projects create ${PROJECT_ID} --name="SingAlong Video Mgmt"

# Set it as the active project
gcloud config set project ${PROJECT_ID}

# Link billing (required for Cloud Run and Cloud SQL)
# Do this in Console: Billing → Link a billing account
```

### 1.3 Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  servicenetworking.googleapis.com \
  compute.googleapis.com
```

### 1.4 Create a Cloud SQL PostgreSQL Instance

1. In [Google Cloud Console](https://console.cloud.google.com/) → **SQL** → **Create instance**
2. Choose **PostgreSQL** and click **Enable**
3. Configure:
   - **Instance ID**: `singalong-db` (or your preferred name)
   - **Password**: Set a strong password for user `postgres` (store it safely)
   - **Region**: Same region as Cloud Run (e.g. `us-central1`) for lower latency
   - **Machine type**: For light use, `db-f1-micro` (shared vCPU, 0.6 GB); for production, `db-g1-small` or larger
   - **Storage**: 10 GB is sufficient to start
4. Click **Create instance** (may take several minutes)
5. When ready, note the **Public IP address** of the instance

### 1.5 Set Shell Variables

Before running the commands below, set these in your shell. Replace the values with yours (from steps 1.2 and 1.4):

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export INSTANCE_ID="singalong-db"
export POSTGRES_PASSWORD="your-postgres-password"
```

**Note:** If your password contains special characters (e.g. `@`, `#`, `%`), URL-encode them in `POSTGRES_PASSWORD` when it's used in connection strings, or use Secret Manager (see step 1.9).

### 1.6 Create the Application Database and User

Connect using the Cloud SQL Auth Proxy (see [Section 4](#4-taking-database-snapshots) for proxy setup) or the Cloud Shell SQL client:

**Option A: Using Cloud Shell in the Cloud Console**

1. Go to **SQL** → your instance → **Connect** → **Open Cloud Shell**
2. Run:

```sql
CREATE DATABASE singalong;
-- The postgres user already exists; use its password from step 1.4
```

**Option B: Using psql via Cloud SQL Auth Proxy** (see Section 4 for proxy setup)

```bash
# With proxy running on localhost:5432 (see Section 4.2)
psql "postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres" -c "CREATE DATABASE singalong;"
```

For Cloud Run, we use the Unix socket path (see step 1.10). For local/admin use, the proxy provides a TCP connection.

### 1.7 Create Artifact Registry Repository

```bash
gcloud artifacts repositories create singalong-repo \
  --repository-format=docker \
  --location=${REGION} \
  --description="SingAlong Video Mgmt container images"
```

### 1.8 Configure Docker for Artifact Registry

```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### 1.9 Build and Push the Docker Image

From the project root (where `Dockerfile` lives):

```bash
# Build the image
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/singalong-repo/singalong-mgmt:latest .

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/singalong-repo/singalong-mgmt:latest
```

Or use Cloud Build to build in the cloud:

```bash
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/singalong-repo/singalong-mgmt:latest .
```

### 1.10 Deploy to Cloud Run

Generate auth values and create secrets in Secret Manager:

```bash
# Generate password hash (replace 'your-secure-password' with the actual admin password)
export AUTH_PASSWORD_HASH=$(node -e "console.log(require('bcryptjs').hashSync('your-secure-password', 10))")
export AUTH_SESSION_SECRET=$(openssl rand -base64 32)

# Create secrets in Secret Manager
echo -n "postgresql://postgres:${POSTGRES_PASSWORD}@/singalong?host=/cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE_ID}" | \
  gcloud secrets create singalong-db-url --data-file=-

echo -n "${AUTH_PASSWORD_HASH}" | gcloud secrets create singalong-auth-hash --data-file=-
echo -n "${AUTH_SESSION_SECRET}" | gcloud secrets create singalong-session-secret --data-file=-

# Deploy (secrets are injected at runtime)
gcloud run deploy singalong-mgmt \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/singalong-repo/singalong-mgmt:latest \
  --platform managed \
  --region ${REGION} \
  --add-cloudsql-instances ${PROJECT_ID}:${REGION}:${INSTANCE_ID} \
  --set-secrets "DATABASE_URL=singalong-db-url:latest" \
  --set-secrets "AUTH_PASSWORD_HASH=singalong-auth-hash:latest" \
  --set-secrets "AUTH_SESSION_SECRET=singalong-session-secret:latest" \
  --set-env-vars "AUTH_USERNAME=admin" \
  --allow-unauthenticated \
  --port 3000
```

#### Updating secrets later

When you need to change a secret (e.g. new admin password, new database URL):

```bash
# Add a new version (e.g. after changing the DB password)
export NEW_DB_PASSWORD="your-new-password"
echo -n "postgresql://postgres:${NEW_DB_PASSWORD}@/singalong?host=/cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE_ID}" | \
  gcloud secrets versions add singalong-db-url --data-file=-

# Or for password hash:
echo -n "$(node -e "console.log(require('bcryptjs').hashSync('new-password', 10))")" | \
  gcloud secrets versions add singalong-auth-hash --data-file=-

# Or for session secret:
echo -n "$(openssl rand -base64 32)" | gcloud secrets versions add singalong-session-secret --data-file=-
```

Cloud Run uses `:latest`, so it will pick up the new version on the next container start. Existing instances keep the old value until they restart. To force all instances to restart and pick up the new secret immediately, run the deploy command above again (same image; it creates a new revision and rolls it out).

### 1.11 Push Schema and Seed the Database

After the first deploy, the database is empty. Push the Prisma schema and seed default genres.

**Option A: From your local machine via Cloud SQL Auth Proxy**

1. Start the Cloud SQL Auth Proxy (see Section 4.2)
2. Point at the proxy: `export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/singalong"` (with variables from 1.5 set), or add that connection string to `.env`
3. Run:

```bash
npm run db:push
npm run db:seed
```

**Option B: From Cloud Shell with a temporary Cloud Run job**

You can also run a one-off job or use Cloud Shell with `psql` and a dump of the schema. The simplest approach is Option A.

### 1.12 (Optional) YouTube API and OAuth

If your client needs real YouTube sync:

1. In [APIs & Services → Library](https://console.cloud.google.com/apis/library), enable **YouTube Data API v3**
2. Create credentials:
   - **API key** (for public video sync): APIs & Services → Credentials → Create credentials → API key
   - **OAuth 2.0 Client** (for unlisted videos): Create credentials → OAuth client ID → Web application
3. Add authorized redirect URI: `https://YOUR_CLOUD_RUN_URL/api/auth/youtube/callback` (get URL from Cloud Run)
4. Add env vars to Cloud Run (or Secret Manager):

```bash
# Set your Cloud Run URL (from the service details in Console)
export CLOUD_RUN_URL="https://singalong-mgmt-xxxxx-uc.a.run.app"

gcloud run services update singalong-mgmt \
  --region ${REGION} \
  --set-env-vars "YOUTUBE_API_KEY=your-api-key" \
  --set-env-vars "GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" \
  --set-env-vars "GOOGLE_CLIENT_SECRET=your-client-secret" \
  --set-env-vars "NEXTAUTH_URL=${CLOUD_RUN_URL}"
```

Then redeploy or create a new revision.

### 1.13 Verify

1. Open the Cloud Run service URL (from the deploy output)
2. Log in with your admin credentials
3. Confirm you can browse genres and add videos

---

## 2. Updating Database Schema and Code

When you change the Prisma schema or application code, use this workflow.

### 2.1 Update the Codebase

```bash
git pull origin main
# Or copy updated files into the project
```

### 2.2 Apply Schema Changes

If `prisma/schema.prisma` changed:

1. **Connect to the production database** (via Cloud SQL Auth Proxy—see Section 4.2)
2. Ensure `.env` has `DATABASE_URL` pointing at the production DB
3. Run:

```bash
npx prisma generate
npm run db:push
```

`db:push` applies schema changes directly. There are no migration files to run.

**Important:** Before pushing schema changes that drop columns or tables, take a snapshot (Section 4) in case you need to roll back.

### 2.3 Rebuild and Redeploy the Application

Ensure the shell variables from Section 1.5 are set (`PROJECT_ID`, `REGION`, `INSTANCE_ID`), then:

```bash
# Build new image (use a tag like a version or date)
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/singalong-repo/singalong-mgmt:latest .

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/singalong-repo/singalong-mgmt:latest

# Deploy new revision (reuses existing env vars and Cloud SQL config)
gcloud run deploy singalong-mgmt \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/singalong-repo/singalong-mgmt:latest \
  --platform managed \
  --region ${REGION} \
  --add-cloudsql-instances ${PROJECT_ID}:${REGION}:${INSTANCE_ID}
```

If you use Secret Manager for env vars, you do not need to re-pass `--set-secrets` unless you changed secrets.

### 2.4 Optional: Run Seeds After Schema Changes

If you added new seed data (e.g. in `prisma/seed.ts`):

```bash
# With DATABASE_URL pointing at production (via proxy)
npm run db:seed
```

Seeds are idempotent (upserts), so rerunning is safe.

---

## 3. Resetting the Database to Factory Defaults

“Factory defaults” means: empty app data plus default genres only (as defined in `prisma/seed.ts`).

### 3.1 What Gets Reset

- All videos, playlists, events, singers, holidays, tags, YouTube connections, etc.
- Schema is recreated; default genres are reseeded.

### 3.2 Prerequisites

- Cloud SQL Auth Proxy running and `DATABASE_URL` in `.env` pointing at the production DB
- PostgreSQL client tools (`psql`) installed

### 3.3 Method A: Restore from a Factory Snapshot (Recommended)

Create a “factory” snapshot once and reuse it:

**One-time: create the factory snapshot**

1. Use a fresh local database (e.g. `docker compose up -d`, then `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/singalong`)
2. Run:

```bash
npm run db:push
npm run db:seed
npm run db:snapshot
```

3. Copy the snapshot from `backups/snapshot_*.sql` and store it safely (e.g. in the repo as `backups/factory-default.sql` or in Cloud Storage)

**To reset production:**

1. Start Cloud SQL Auth Proxy (Section 4.2)
2. Set `DATABASE_URL` in `.env` to the proxy connection
3. Run:

```bash
npm run db:restore -- backups/factory-default.sql
```

This overwrites the production DB with the factory state.

### 3.4 Method B: Drop Schema and Re-Push

If you do not have a factory snapshot:

1. Start Cloud SQL Auth Proxy
2. Connect with `psql` and drop the schema:

```bash
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
```

3. Re-push schema and seed:

```bash
npm run db:push
npm run db:seed
```

**Warning:** This removes all data. Take a snapshot first if you might need to restore.

### 3.5 Method C: Via Cloud Console (Cloud SQL Backups)

This resets the whole instance, not just the app database:

1. Create an on-demand backup (Section 4.3) before any destructive action
2. To fully reset: you would need to restore a backup from when the database was empty, or use Method A or B for the `singalong` database only

For app-level resets, Method A or B is preferable.

---

## 4. Taking Database Snapshots

Two options: application-level SQL snapshots (portable) and GCP Cloud SQL backups (managed).

### 4.1 Application-Level Snapshots (pg_dump)

Portable SQL dumps suitable for restore to any PostgreSQL instance.

#### How it works

The snapshot runs **on your local machine** (e.g. `pg_dump` on your laptop). It connects to whichever database is in `DATABASE_URL`—from your shell or `.env`. To snapshot **production**, you run the Cloud SQL Auth Proxy: that creates a tunnel so that `localhost:5432` on your machine forwards to the prod Cloud SQL instance. You point `DATABASE_URL` at `127.0.0.1:5432`, and the snapshot goes through the proxy to prod—but the script itself runs locally.

**Important:** Don’t put the prod connection string in `.env`. If you do, `npm run dev` would connect to prod when you run the app locally. Use `export DATABASE_URL=...` only in the terminal where you run snapshot/restore, so it applies just to that session. Your `.env` should keep the local DB (e.g. Docker) for normal development.

#### Prerequisites

- PostgreSQL client tools: `pg_dump`, `psql`
- Mac: `brew install postgresql@16`
- Linux: `apt install postgresql-client` or `yum install postgresql`

#### Create a Snapshot (of production)

1. Start the Cloud SQL Auth Proxy in a separate terminal (Section 4.2)
2. In another terminal, set `DATABASE_URL` for this session only (don’t add to `.env`):  
   `export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/singalong"`
3. Run:

```bash
npm run db:snapshot
```

Snapshot is written to `backups/snapshot_YYYY-MM-DDTHH-MM-SS.sql`.

#### Restore from a Snapshot

```bash
npm run db:restore -- backups/snapshot_2025-02-18T12-30-45.sql
```

**Warning:** Restore overwrites all existing data. For production, consider restoring to a staging DB first.

### 4.2 Cloud SQL Auth Proxy (Required for Local Snapshots)

The proxy allows your local machine to connect to Cloud SQL securely. Ensure `PROJECT_ID`, `REGION`, and `INSTANCE_ID` are set (Section 1.5).

**Download and run:**

```bash
# Download the proxy (one time)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Run
./cloud-sql-proxy ${PROJECT_ID}:${REGION}:${INSTANCE_ID} --port 5432
```

On Linux (e.g. x86_64):

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
./cloud-sql-proxy ${PROJECT_ID}:${REGION}:${INSTANCE_ID} --port 5432
```

Keep this running in a separate terminal while you run `db:snapshot`, `db:restore`, `db:push`, or `db:seed`.

**Authentication:** Ensure you are logged in (`gcloud auth login`) and have the Cloud SQL Client role on the instance.

### 4.3 GCP Cloud SQL Native Backups

Managed backups in GCP, good for point-in-time recovery and compliance.

#### Create an On-Demand Backup (Console)

1. Go to [Cloud SQL](https://console.cloud.google.com/sql) → select your instance
2. Click **Backups** in the left menu
3. Click **Create backup**
4. Add a description (e.g. “Pre-deployment backup”) and click **Create**

#### Create an On-Demand Backup (gcloud)

```bash
gcloud sql backups create \
  --instance=${INSTANCE_ID} \
  --description="Manual backup $(date +%Y-%m-%d)"
```

#### Restore from a Cloud SQL Backup

1. Cloud SQL → your instance → **Backups**
2. Select a backup → **Restore**
3. Choose **Restore to same instance** (overwrites current data) or **Restore to new instance**

**Note:** Restoring overwrites the entire instance. For only the `singalong` database, application-level snapshots (Section 4.1) are more flexible.

### 4.4 Storing Snapshots in Cloud Storage

For durability, copy SQL snapshots to a GCS bucket (ensure `PROJECT_ID` is set):

```bash
# Create bucket (one time)
gsutil mb -l ${REGION} gs://${PROJECT_ID}-singalong-backups

# Copy a snapshot
gsutil cp backups/snapshot_2025-02-18T12-30-45.sql gs://${PROJECT_ID}-singalong-backups/

# List backups
gsutil ls gs://${PROJECT_ID}-singalong-backups/

# Download for restore
gsutil cp gs://${PROJECT_ID}-singalong-backups/snapshot_2025-02-18T12-30-45.sql backups/
npm run db:restore -- backups/snapshot_2025-02-18T12-30-45.sql
```

### 4.5 Automated Backups (Cloud SQL)

Cloud SQL can run automated daily backups:

1. Cloud SQL → your instance → **Edit**
2. Under **Automated backups**, enable and set the backup window
3. Backups are retained per your retention settings

Use these for disaster recovery; use application-level snapshots for targeted restores of the `singalong` database.

---

## Summary Cheat Sheet

| Task | Command / Action |
|------|------------------|
| First deploy | Follow Section 1 step by step |
| Update code | `db:push` → rebuild image → `gcloud run deploy` |
| Reset DB to factory | `db:restore` from factory snapshot, or drop schema + `db:push` + `db:seed` |
| Take snapshot (app) | Start proxy → `npm run db:snapshot` |
| Take snapshot (GCP) | Console: Backups → Create backup, or `gcloud sql backups create` |
| Restore snapshot (app) | `npm run db:restore -- backups/snapshot_xxx.sql` |
