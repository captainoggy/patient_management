# Patient Management

Full-stack clinic patient directory: **Django REST Framework** API, **React + TypeScript** UI, **Docker Compose** stack, and **GitHub Actions** CI.

## Reviewer quick start

1. **Prerequisites:** Docker with Compose v2; optionally Node 20+ and Python 3.12+ for local (non-Docker) dev.
2. **Clone → env → up:** `cp .env.example .env` (optional), then `docker compose up --build` (or `make up`).
3. **Migrations:** run automatically in the `api` container on startup; to run only migrations: `make migrate`.
4. **URLs:** UI at **http://localhost:8080**; API health at **http://localhost:8080/api/v1/health/** (proxied). Django admin: **http://localhost:8080/admin/** (create superuser in container if needed: `docker compose exec api python manage.py createsuperuser`).
5. **Log in:** use **`demo`** / **`demo12345`** when **`SEED_DEMO=1`** (Compose default). Session + CSRF: call **`GET /api/v1/auth/session/`** first, then **`POST /api/v1/auth/login/`** with the JSON below. After login, the workspace has **Patients**, **Staff**, and **Appointments** tabs (same clinic scope as the API).

## Authentication & tenancy (for reviewers)

- **There is no anonymous access to patient data.** List/create/update/delete patients require an authenticated **session** (cookie) after `POST /api/v1/auth/login/`. `PatientViewSet` is scoped by **`HasPatientClinicAccess`** and **`resolve_clinic_id`** (see **Clinic scoping** below)—patient rows are never “global.”
- **Default credentials (local Docker):** after `docker compose up`, the API runs `seed_demo` when **`SEED_DEMO=1`** (default in Compose). Log in as **`demo`** / **`demo12345`**. That user has a **`UserProfile`** tied to the seeded **Demo Clinic**.
- **Controlling the demo shortcut:** set **`SEED_DEMO=0`** in your environment (or Compose) to skip seeding; create users and `UserProfile` rows via **Django admin** (`/admin/`) instead. There is no separate “dev bypass” flag that disables auth for patients—only optional **`DJANGO_FIXED_CLINIC_ID`** for single-clinic deployments (still requires login).
- **Useful env vars:** see **`.env.example`** at the repo root (copy to `.env` for Compose overrides).

## Run with Docker

**Prerequisites:** Docker with Compose v2.

**Environment:** Copy **`.env.example`** to **`.env`** to override secrets or DB names. Compose reads a root **`.env`** for variable substitution (e.g. `POSTGRES_PASSWORD`).

```bash
docker compose up --build
# or: make up
```

- **App (UI + proxied API):** http://localhost:8080  
- **Demo login:** `demo` / `demo12345` (seeded on API startup when `SEED_DEMO=1`)

The `api` container runs **`migrate`** on start, then optional **`seed_demo`** (see **`backend/docker-entrypoint.sh`**). To run migrations alone without bringing the stack up:

```bash
make migrate
# same as: docker compose run --rm api python manage.py migrate
```

The `web` service serves the SPA and proxies `/api/*` to the Django container so the browser is **same-origin** with the API (session cookies + CSRF; no CORS layer).

## Local development (without Docker)

**Backend** (PostgreSQL or SQLite):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DJANGO_DB_ENGINE=sqlite   # optional; default is Postgres settings
export DJANGO_SECRET_KEY=dev-secret
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8000`, so the UI stays same-origin with the API in dev as well.

## API surface (v1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/auth/session/` | Session check; sets CSRF cookie. Returns `authenticated` and `clinic` when logged in. |
| POST | `/api/v1/auth/login/` | JSON `username`, `password`; establishes session; returns `clinic`. Requires CSRF header after session GET. |
| POST | `/api/v1/auth/logout/` | Ends session (authenticated). |
| GET | `/api/v1/patients/` | Paginated list (`count`, `next`, `previous`, `results`). See **Clinic scoping** below. Query: `page`, `page_size` (max 100). |
| POST | `/api/v1/patients/` | Create patient in the resolved clinic (same scoping rules). |
| GET/PATCH/PUT/DELETE | `/api/v1/patients/{id}/` | Retrieve, update, delete (object must belong to resolved clinic). |
| GET | `/api/v1/clinicians/` | Read-only paginated list of **Clinician** rows for the resolved clinic (same scoping rules as patients). Query: `page`, `page_size`. |
| GET | `/api/v1/clinicians/{id}/` | Read-only detail; clinician must belong to the resolved clinic. |
| GET | `/api/v1/appointments/` | Paginated **Appointment** rows whose patient is in the resolved clinic; each item includes patient names and nested clinicians. Query: `page`, `page_size`. |
| POST | `/api/v1/appointments/` | Create a visit: JSON `patient` (id), `scheduled_at` (ISO 8601), optional `notes`, optional `clinician_ids` (ids of **Clinician** rows in the same clinic). |
| GET/PATCH/PUT/DELETE | `/api/v1/appointments/{id}/` | Retrieve, update, or delete a visit (patient must be in the resolved clinic). **PATCH** accepts `scheduled_at`, `notes`, `clinician_ids` (replaces staff assignment; omit to leave staff unchanged). |
| GET | `/api/v1/health/` | Liveness JSON for the API process (useful in Compose / load balancers). |

Authenticated requests use the **session cookie**; mutating requests send **`X-CSRFToken`** (see `GET /auth/session/`).

### Example JSON payloads

**Login** — `POST /api/v1/auth/login/` (after `GET /api/v1/auth/session/` for CSRF cookie):

```json
{ "username": "demo", "password": "demo12345" }
```

**Create patient** — `POST /api/v1/patients/` (authenticated; clinic from scoping rules; body has no `clinic` field):

```json
{
  "first_name": "Ada",
  "last_name": "Lovelace",
  "date_of_birth": "1815-12-10",
  "email": "ada@example.com",
  "phone": "+1 555 0100"
}
```

**Update patient** — `PATCH /api/v1/patients/{id}/` with any subset of writable fields (`first_name`, `last_name`, `date_of_birth`, `email`, `phone`).

**List (paginated)** — `GET /api/v1/patients/?page=1&page_size=20` → `{ "count", "next", "previous", "results": [ ... ] }`.

### Clinic scoping for `/api/v1/patients/`

Every patient operation runs in exactly **one clinic id**, resolved in this order:

1. **`DJANGO_FIXED_CLINIC_ID`** (optional env) — Single-clinic deployments. The id must exist in the database. Staff must have a `UserProfile` for that clinic; otherwise `403`. Superusers are scoped to this id without passing headers. If the id does not exist, the API returns `400` (misconfiguration).
2. **`X-Clinic-Id`** header **or** **`clinic_id`** query parameter — If either is present, that id is used **after validation**: non-superusers may only use their own `UserProfile.clinic_id`; a mismatch is `403`. Superusers may use any existing clinic id; unknown id is `400`.
3. **Default** — If no fixed id and no header/query: **staff** use `UserProfile.clinic`. **Superusers** must pass `X-Clinic-Id` or `clinic_id` (otherwise `400`), so clinic scope is always explicit for admins.

The React app passes **`clinic_id`** on list requests to match the logged-in user’s clinic from session payload (redundant but clear for API clients and tests). The **Staff** and **Appointments** tabs call **`/api/v1/clinicians/`** and **`/api/v1/appointments/`** with the same parameter.

## CI

Workflow **`.github/workflows/ci.yml`** runs on **`pull_request`** and on **`workflow_dispatch`** (Actions → CI → Run workflow).

- **Backend:** `pip install` → `manage.py check` → `makemigrations --check --dry-run` → `manage.py test patients appointments` (SQLite via `DJANGO_DB_ENGINE=sqlite`).
- **Frontend:** `npm ci` → `npm run lint` → `npm run typecheck` → `npm run build` (`VITE_API_ROOT=/api`).

## Architecture (brief)

- **Tenancy:** Patients are always tied to a `clinic_id`; each request resolves exactly one clinic (`resolve_clinic_id` + permissions). The API does not expose a global patient list; superusers must pass explicit clinic scope unless `DJANGO_FIXED_CLINIC_ID` is set.
- **API shape:** Django REST Framework viewsets and serializers; session cookies for auth; mutating calls require CSRF. The SPA talks to `/api` on the same host (Vite proxy, Compose `web` service, or Vercel rewrite) so credentials work without a separate CORS policy. On the patient show page, staff can **add / edit / delete visits** and assign **clinicians** to each visit (same clinic only).
- **Docker Compose:** Postgres (`db`) starts first with a healthcheck; `api` runs migrations then serves the app; `web` serves the built React app and reverse-proxies `/api` to `api:8000`.

## Domain model

- **Clinic** → many **Patients**; each patient belongs to one clinic.  
- **Patient** → many **Appointments**.  
- **Appointment** → many **Clinicians** (staff), each **Clinician** belongs to a **Clinic**.  
- Staff **User**s link to a clinic via **UserProfile**; the UI lists only that clinic’s patients, clinicians, and appointments (clinicians and appointments are read-only in the SPA).

## Dependencies (why each)

- **Django** — required stack; ORM, admin, migrations.  
- **Django REST framework** — JSON API for patients (validation, consistent request/response handling vs hand-rolled views).  
- **psycopg2-binary** — PostgreSQL driver used by Compose.  
- **Gunicorn** — WSGI server in the API container (not `runserver`).  

No JWT library, no CORS middleware: the SPA always talks to the API through the **same origin** (Vite proxy, Docker nginx, or Vercel rewrite).

## Deploy: Vercel (frontend) + Render (API)

This pairing is **appropriate** if the browser only calls **`/api` on your Vercel hostname**. Vercel then **proxies** those requests to Render, so session cookies and CSRF stay same-origin (no CORS layer).

**Prerequisite:** push this repo to GitHub (or GitLab/Bitbucket) so both Render and Vercel can connect it. The blueprint uses the **free** web and Postgres plans (change `plan` in `render.yaml` if you need paid tiers).

### 1) Render (Django + Postgres)

- Connect the GitHub repo and use **`render.yaml`** (Blueprint) or create a **Web Service** from `./backend/Dockerfile` with context `./backend`.
- After the first deploy, open the service **Environment** tab and set **`DJANGO_CSRF_TRUSTED_ORIGINS`** to your real Vercel URLs (comma-separated), for example:
  - `https://your-app.vercel.app`
  - plus any custom domain like `https://app.yourdomain.com`  
  Django does not accept wildcards here; list each origin explicitly.
- **`DJANGO_ALLOWED_HOSTS`** must include your Render hostname (default in `render.yaml`: `patient-mgmt-api.onrender.com`). If you rename the service, update this and the Vercel rewrite below.
- **`SEED_DEMO`**: set to `1` once if you want the demo user (`demo` / `demo12345`) loaded; use `0` for a clean production database.
- **`DJANGO_HTTPS_DEPLOYMENT`**: keep `true` on Render so cookies and CSRF work over HTTPS behind their proxy.

### 2) Vercel (React build)

**Not this:** On **New Project**, Vercel may show an **“Services”** preset with **Vite** (`frontend/`) and **Django** (`backend/`). **Do not use that** for this app. The API runs on **Render**; Vercel should host **only the static Vite app**. Skip **experimental** multi-service / `backend` on Vercel. Instead, open **Application** or **Framework** (wording varies) and pick a **single** app: **Vite** or **Other** / **“None”**—one build, not “Services”.

- Import the same repo. **`VITE_API_ROOT=/api`** is set in **`vercel.json` `build.env`**; you can still override in the Vercel project **Environment Variables** if needed.
- **Root directory (pick one, be consistent with which `vercel.json` is used):**
  - **Repository root (recommended for this repo):** set **Root Directory** to **empty** or **`.`** so Vercel uses the top-level **`vercel.json`**, which runs `cd frontend && npm run build` and outputs **`frontend/dist`**.
  - **Only the `frontend` folder:** if Vercel (or the Services wizard) set **Root Directory** to **`frontend`**, use the **`frontend/vercel.json`** config: install/build run in that folder, output **`dist`**. You must not use the `cd frontend && …` form there or the install will fail with “No such file or directory”.
- **`vercel.json`** rewrites (in **both** files) point `/api/*` to **`https://patient-mgmt-api.onrender.com/api/*`**. If your Render service name differs, change **both** URLs and **`DJANGO_ALLOWED_HOSTS`** on Render to match.

### 3) Order of operations

1. Deploy **Render** and confirm `GET https://<your-service>.onrender.com/api/v1/health/` returns JSON.
2. Set **`DJANGO_CSRF_TRUSTED_ORIGINS`** on Render to your **Vercel** URL(s).
3. Deploy **Vercel**, then smoke-test login and patients on the Vercel URL.
4. **Django admin** on the API host (`https://<your-service>.onrender.com/admin/`): create a user from the service **Shell** in the Render dashboard, e.g. `python manage.py createsuperuser` (same as local Compose, but run inside the web instance).

If the SPA called the Render URL **directly** in the browser (two different sites), you would need CORS and cross-site cookies; this project avoids that by design.
