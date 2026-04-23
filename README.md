# Patient Management

Django + Django REST Framework API and a React (TypeScript) SPA. **Postgres** and the API run in Docker; the UI is served on port **8080** and proxies **`/api`** to the API so the browser stays on one origin (session + CSRF work without a separate CORS layer).

## Public deployment

| | Host |
|---|------|
| **Frontend (static SPA)** | [Vercel](https://vercel.com) — [https://patient-management-xb26.vercel.app](https://patient-management-xb26.vercel.app) *(use your Vercel **Domains** URL if it differs.)* |
| **Backend (API + admin)** | [Render](https://render.com) — [https://patient-mgmt-api-o6ma.onrender.com](https://patient-mgmt-api-o6ma.onrender.com) |

The browser only talks to the Vercel origin; `/api` is **rewritten** there to the Render service so sessions stay same-origin. Change **`vercel.json`** rewrites if the API base URL changes.

## Run locally

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) with [Compose v2](https://docs.docker.com/compose/).

From the repo root:

```bash
docker compose up --build
```

(Equivalent: `make up`.)

- **App:** [http://localhost:8080](http://localhost:8080) — patients: list, add, edit, remove.
- **Login:** `demo` / `demo12345` (data is seeded on API start when **`SEED_DEMO=1`**, the Compose default).
- **API health:** [http://localhost:8080/api/v1/health/](http://localhost:8080/api/v1/health/)
- **Django admin:** [http://localhost:8080/admin/](http://localhost:8080/admin/) — optional superuser:  
  `docker compose exec api python manage.py createsuperuser`

**Optional:** copy **`.env.example`** to **`.env`** if you want to override DB credentials or other settings; Compose works with its built-in defaults without a `.env` file.

Migrations run when the `api` container starts. To run them alone: `make migrate` (or `docker compose run --rm api python manage.py migrate`).

**Docker health checks (Compose):** `db` uses `pg_isready`; `api` hits `GET /api/v1/health/`; `web` (nginx) checks the root URL. The `web` service waits until `api` is healthy before starting.

## Key features

- **Clinic-scoped** patient list and **full CRUD** in the UI (add, edit, delete).
- **Session authentication** (cookie) with CSRF for mutating API calls; no public patient data without login.
- **Domain model** aligned with the brief: clinic → patients; patient → appointments; appointment ↔ multiple **clinicians** (M2M).
- **Appointments** in the app: list/create/edit/delete visits on a patient, assign clinic staff; **read-only** staff directory and org-wide **appointments** list for the same clinic.
- **Docker Compose** for Postgres, API (migrations + `seed` on start), and nginx + built SPA; **CI** in GitHub Actions (PRs + manual runs), optional **Render** + **Vercel** for production.
- **Django admin** (local and deployed) for operational access; production static/admin handling via the API image.

## Engineering highlights

- **API:** DRF, explicit clinic resolution and permissions, DB constraints (e.g. unique visit per patient/time), throttling, structured logging, HTTPS-oriented settings in deployment.
- **Quality:** Ruff (Python), `manage.py test` (patients, appointments), Vitest/Testing Library/ESLint/Prettier (frontend); CI runs those paths.
- **Ops:** `render.yaml` blueprint, API container runs as **non-root**, `npm ci` in the frontend image, Dependabot and optional pre-commit hooks; admin UI with collected static files in the API image for production.

## Repo layout

| Path | Role |
|------|------|
| `docker-compose.yml` | Postgres, API, and static `web` (nginx on **8080**) |
| `backend/` | Django project, DRF, models, tests |
| `frontend/` | Vite + React, unit tests under `npm run test:ci` |

REST routes live under **`/api/v1/`** (e.g. `/api/v1/patients/`). See `backend/config/urls.py` and the `patients` / `appointments` / `clinicians` apps.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on **pull requests** and on **manual dispatch** (Actions → run workflow). It runs backend checks/tests and the frontend `test:ci` + production build.

## Run without Docker (optional)

- **API:** `cd backend` → create a venv → `pip install -r requirements.txt` → set `DJANGO_SECRET_KEY` → `python manage.py migrate` and `runserver` (SQLite: set `DJANGO_DB_ENGINE=sqlite`; see **`.env.example`**).
- **UI:** `cd frontend` → `npm ci` → `npm run dev` (Vite proxies `/api` to the API, default `http://127.0.0.1:8000`).
