# Patient Management

Full-stack clinic patient directory: **Django** API, **React + TypeScript** UI, **Docker Compose** stack, and **GitHub Actions** CI (manual `workflow_dispatch`).

## Run with Docker

Prerequisites: Docker with Compose v2.

```bash
docker compose up --build
```

- **App (UI + proxied API):** http://localhost:8080  
- **Demo login:** `demo` / `demo12345` (seeded on API startup)

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
| GET | `/api/v1/patients/` | List patients for the authenticated user’s clinic. |
| POST | `/api/v1/patients/` | Create patient (clinic inferred from user). |
| GET/PATCH/PUT/DELETE | `/api/v1/patients/{id}/` | Retrieve, update, delete (scoped to clinic). |
| GET | `/api/v1/health/` | Liveness JSON for the API process (useful in Compose / load balancers). |

Authenticated requests use the **session cookie**; mutating requests send **`X-CSRFToken`** (see `GET /auth/session/`).

## CI

GitHub Actions workflow **CI** is triggered only via **Actions → CI → Run workflow** (`workflow_dispatch`). It runs Django tests (SQLite) and a production frontend build.

## Domain model

- **Clinic** → many **Patients**; each patient belongs to one clinic.  
- **Patient** → many **Appointments**.  
- **Appointment** → many **Clinicians** (staff), each **Clinician** belongs to a **Clinic**.  
- Staff **User**s link to a clinic via **UserProfile**; the UI lists only that clinic’s patients.

## Dependencies (why each)

- **Django** — required stack; ORM, admin, migrations.  
- **Django REST framework** — JSON API for patients (validation, consistent request/response handling vs hand-rolled views).  
- **psycopg2-binary** — PostgreSQL driver used by Compose.  
- **Gunicorn** — WSGI server in the API container (not `runserver`).  

No JWT library, no CORS middleware: the SPA always talks to the API through the **same origin** (Vite proxy, Docker nginx, or Vercel rewrite).

## Deploy: Vercel (frontend) + Render (API)

This pairing is **appropriate** if the browser only calls **`/api` on your Vercel hostname**. Vercel then **proxies** those requests to Render, so session cookies and CSRF stay same-origin (no CORS layer).

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

- Import the same repo. Vercel will pick up root **`vercel.json`** (builds `frontend/`, output `frontend/dist`).
- In **Environment Variables** (Production): **`VITE_API_ROOT`** = `/api` so the SPA calls relative URLs.
- **`vercel.json`** rewrites `/api/*` to **`https://patient-mgmt-api.onrender.com/api/*`**. If your Render service name differs, change **both** this URL and **`DJANGO_ALLOWED_HOSTS`** on Render to match.

### 3) Order of operations

1. Deploy **Render** and confirm `GET https://<your-service>.onrender.com/api/v1/health/` returns JSON.
2. Set **`DJANGO_CSRF_TRUSTED_ORIGINS`** on Render to your **Vercel** URL(s).
3. Deploy **Vercel**, then smoke-test login and patients on the Vercel URL.

If the SPA called the Render URL **directly** in the browser (two different sites), you would need CORS and cross-site cookies; this project avoids that by design.
