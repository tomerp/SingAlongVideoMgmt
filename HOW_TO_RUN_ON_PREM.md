## How to Run SingAlong Video Management On-Prem (After Initial Setup)

Use this guide after the initial deployment in `DEPLOY_TO_ONPREM_MACHINE_AND_UPDATE.md` is complete and the machine has been restarted, or Docker/app containers were stopped.

---

### 1. Start Docker Desktop

- **Launch Docker Desktop** from the Start menu.
- Wait until it shows **"Docker Desktop is running"** (no red error icon).

If Docker fails to start, fix that first (restart Docker Desktop or reboot Windows) before continuing.

---

### 2. Open a terminal in the project folder

1. Open **PowerShell**.
2. Change to the project directory (adjust path if yours is different):

   ```powershell
   cd "G:\Dropbox\Rivka and Efraim Shared\SingAlong club\Administration\SingAlongVideoMgmt"
   ```

3. Confirm `.env` exists in this folder (should contain `POSTGRES_PASSWORD`, `AUTH_USERNAME`, `AUTH_PASSWORD_HASH`, `AUTH_SESSION_SECRET`).

---

### 3. Start the app and database

From the project folder, run:

```powershell
docker compose -f docker-compose.onprem.yml up -d
```

- This will:
  - Start the **PostgreSQL** database container.
  - Build (if needed) and start the **app** container.
- The first run after a code update may take a few minutes while it builds.

You can check running containers with:

```powershell
docker ps
```

You should see containers for the app and the Postgres database.

---

### 4. Use the application

1. Open a browser on the same machine.
2. Go to:

   `http://localhost:3000`

3. Log in with:
   - **Username**: the value in `AUTH_USERNAME` (default in docs is `admin`).
   - **Password**: the password whose hash you stored in `AUTH_PASSWORD_HASH`.

As long as Docker Desktop stays running and the containers remain up, the app will be available.

---

### 5. How to stop the app

From the project folder, you can stop and remove the containers with:

```powershell
docker compose -f docker-compose.onprem.yml down
```

This stops the app and DB containers but **keeps the database data** (volumes) on disk so nothing is lost.

If you only want to stop containers without removing them:

```powershell
docker compose -f docker-compose.onprem.yml stop
```

To start again later after `stop`, run:

```powershell
docker compose -f docker-compose.onprem.yml start
```

---

### 6. Quick recap (after a reboot)

1. Start **Docker Desktop** and wait until it’s running.
2. Open **PowerShell**.
3. `cd` into the project folder.
4. Run:

   ```powershell
   docker compose -f docker-compose.onprem.yml up -d
   ```

5. Browse to `http://localhost:3000` and log in.

