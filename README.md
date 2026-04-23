# Patient Management

Full-stack clinic directory: **Django REST Framework** + **session auth**, **React + TypeScript** SPA, **Docker Compose**, **GitHub Actions** CI. The SPA calls **`/api` on the same host** (Vite proxy, Compose `web`, or Vercel rewrite) so the browser is **same-origin** with the API (session cookies and CSRF; no CORS layer).

## Quick start (Docker)

1. **Prereqs:** Docker with Compose v2. Optionally copy **`.env.example`** → **`.env`** (Compose and secrets).
2. **Up:** `docker compose up --build` (or `make up`). The `api` service runs **migrations** on start, then optional **`seed_demo`** when `SEED_DEMO=1` (default in Compose).
3. **URLs:** UI and proxied API **http://localhost:8080**; health **http://localhost:8080/api/v1/health/**. Django admin **http://localhost:8080/admin/** (superuser: `docker compose exec api python manage.py createsuperuser`).
4. **Login:** with **`SEED_DEMO=1`**, use **`demo`** / **`demo12345`**. The SPA should call **`GET /api/v1/auth/session/`** first, then **`POST /api/v1/auth/login/`**; mutating calls need **`X-CSRFToken`**.

**No anonymous patient access:** list/create/update patients requires an authenticated session. **Clinic scoping** is per request (see table section below). Set **`SEED_DEMO=0`** to skip seeding and manage users via admin. For single-clinic mode see **`DJANGO_FIXED_CLINIC_ID`** in **`.env.example`**.

Migrations only: `make migrate` (or `docker compose run --rm api python manage.py migrate`).

## Local development (no Docker)

**Backend** (SQLite optional): `cd backend` → venv → `pip install -r requirements.txt` → `export DJANGO_SECRET_KEY=...` and optionally `DJANGO_DB_ENGINE=sqlite` → `migrate` → `seed_demo` → `runserver`.  
**Frontend:** `cd frontend` → `npm install` → `npm run dev` (Vite proxies `/api` to `http://127.0.0.1:8000`).

## API (v1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/auth/session/` | Session + CSRF cookie; `authenticated` and `clinic` when logged in. |
| POST | `/api/v1/auth/login/` | JSON `username`, `password`; session. |
| POST | `/api/v1/auth/logout/` | Logout. |
| GET | `/api/v1/patients/` | Paginated list. Query: `page`, `page_size` (max 100). |
| POST | `/api/v1/patients/` | Create in resolved clinic. |
| GET/PATCH/PUT/DELETE | `/api/v1/patients/{id}/` | CRUD; object must be in resolved clinic. |
| GET | `/api/v1/clinicians/` | Paginated; clinic-scoped. Query: `page`, `page_size`. |
| GET | `/api/v1/clinicians/{id}/` | Read-only detail. |
| GET | `/api/v1/appointments/` | Paginated visits for patients in the resolved clinic. |
| POST | `/api/v1/appointments/` | Create: `patient`, `scheduled_at` (ISO 8601), optional `notes`, `clinician_ids`. |
| GET/PATCH/PUT/DELETE | `/api/v1/appointments/{id}/` | Visit CRUD. **PATCH** may update `scheduled_at`, `notes`, `clinician_ids`. |
| GET | `/api/v1/health/` | Liveness JSON. |

### Example bodies

**Login** (after `GET /auth/session/`): `{ "username": "demo", "password": "demo12345" }`  
**Create patient:** `first_name`, `last_name`, `date_of_birth`, `email`, `phone` (no `clinic` in body).

### Clinic scoping (patients, clinicians, appointments)

One **clinic id** per request, resolved in order:

1. **`DJANGO_FIXED_CLINIC_ID`** (optional) — id must exist; staff must have that clinic in their profile or `403`; superusers follow the same id without passing headers. Unknown id: `400`.
2. **`X-Clinic-Id`** or **`clinic_id`** — if present, that id is used after validation: non-superusers only their own `UserProfile.clinic_id` (`403` on mismatch). Superusers: any **existing** clinic id; unknown id: `400`.
3. **Default** (no fixed id, no header/query) — **staff** use `UserProfile.clinic`. **Superusers** must pass **`X-Clinic-Id`** or **`clinic_id`** (otherwise `400`).

The React app passes **`clinic_id`** on lists to match the session. **Stack:** **Clinic** → **Patients** & **Clinicians**; **Appointments** link patients to clinicians. Clinicians/appointments are read-only in the SPA except visit CRUD on the patient page.

## CI

**`.github/workflows/ci.yml`** on **pull_request** and **workflow_dispatch**: backend Ruff, `manage.py check`, `makemigrations --check --dry-run`, `manage.py test patients appointments` (SQLite); frontend `test:ci` (lint, format, typecheck, unit tests) then `build` with `VITE_API_ROOT=/api`.

## Stack

- **Django** + **DRF**; **Gunicorn** in the API image; **Postgres** in Compose (**psycopg2**). No JWT: session cookies only. Compose: `db` (healthcheck) → `api` (migrate + app) → `web` (static SPA, proxies `/api` to `api:8000`).

## Deploy: Vercel (frontend) + Render (API)

Vercel serves the Vite build and **rewrites** `/api/*` to your Render service so cookies stay same-origin. Push the repo to GitHub; **`render.yaml`** uses free web + Postgres plans unless you change `plan`.

### Render

- Blueprint **`render.yaml`** or Web Service: **`./backend/Dockerfile`**, context **`./backend`**.
- **Environment:** Set **`DJANGO_CSRF_TRUSTED_ORIGINS`** to each Vercel origin explicitly (e.g. `https://your-app.vercel.app`, `https://app.example.com`—comma-separated; **no** `*` wildcards). **`DJANGO_ALLOWED_HOSTS`** must match your Render hostname (see **`render.yaml`** default). **`DJANGO_HTTPS_DEPLOYMENT=true`**. **`SEED_DEMO`**: `1` once for demo user, then **`0`**.

### Vercel

- **Do not** use the **“Services”** preset that deploys **Django** on Vercel. Deploy **one** Vite/Other app; API stays on **Render**.
- **Root directory:** **`.`** (repo root) → root **`vercel.json`**, or **`frontend`** → **`frontend/vercel.json`** (do not mix with `cd frontend` when already in `frontend/`). **`VITE_API_ROOT=/api`** is in **`vercel.json` `build.env`**.
- **Rewrites** in those files target **`https://patient-mgmt-api.onrender.com/api/*`**; if your Render name differs, update **both** rewrites and **`DJANGO_ALLOWED_HOSTS`**.

### Order

1. Deploy Render; check **`GET https://<api>.onrender.com/api/v1/health/`**.
2. Set **`DJANGO_CSRF_TRUSTED_ORIGINS`** to your Vercel URL; restart if needed.
3. Deploy Vercel; test login. **Admin:** Render **Shell** → `python manage.py createsuperuser`.

If the browser called the Render URL **directly** (cross-site), you would need CORS and cross-site cookies; this project avoids that by design.
