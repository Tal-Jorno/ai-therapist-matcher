# AI Therapist Matcher

A full-stack therapist matching app:

- Backend: FastAPI + SQLAlchemy + Postgres
- Frontend: React + Vite + React Router (Hebrew RTL UI)

## Repository layout

- Backend code: [`app/`](app:1)
- Frontend code: [`frontend/`](frontend:1)

## Tech stack

Backend

- FastAPI (Uvicorn)
- SQLAlchemy
- PostgreSQL 16 (Docker)

Frontend

- React + TypeScript
- Vite
- react-router-dom

## Running the full system with Docker (recommended)

Prerequisite: Docker Desktop is running.

Build and start all services:

```bash
docker compose up -d --build
```

This starts:

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Postgres: localhost:5432
- pgAdmin: http://localhost:5050
- Dozzle (logs): http://localhost:9999

Stop everything:

```bash
docker compose down
```

### Database credentials

- Database: `therapist_matcher`
- Username: `postgres`
- Password: `postgres`

## Local development (without Docker)

You can also run frontend/backend separately.

### Backend

From repo root:

```bash
python -m venv .venv
.
```

Then install deps and run Uvicorn (exact command may vary by your setup).

Notes:

- The API base URL used by the frontend defaults to `http://localhost:8000` (see [`frontend/src/services/env.ts`](frontend/src/services/env.ts:1)).
- CORS is enabled for the Vite dev server origins (`http://localhost:5173`, `http://127.0.0.1:5173`) in [`app/main.py`](app/main.py:1).

### Frontend

From repo root:

```bash
cd frontend
npm install
npm run dev -- --host
```

## Environment variables

Frontend

- `VITE_API_BASE_URL` (optional)
  - Default: `http://localhost:8000`
  - Used by [`createApiClient()`](frontend/src/services/apiClient.ts:20)

## Auth/session (frontend)

This project uses a minimal frontend session layer:

- Stored in `localStorage` under `psychologi_session_v1`.
- Implemented in one consolidated module: [`frontend/src/auth/types.ts`](frontend/src/auth/types.ts:1)
  - [`AuthProvider`](frontend/src/auth/types.ts:86)
  - [`useAuth()`](frontend/src/auth/types.ts:121)
  - [`RequireRole`](frontend/src/auth/types.ts:130)

### Roles

- `client`
- `therapist`

### Protected routes

Configured in [`frontend/src/App.tsx`](frontend/src/App.tsx:1):

- Client only:
  - `/user/chat`
  - `/user/search`
- Therapist only:
  - `/therapist/dashboard`

Unauthenticated users are redirected to `/login`.

## API endpoints used by the frontend

Auth-related calls are centralized in [`frontend/src/services/authApi.ts`](frontend/src/services/authApi.ts:1):

- Client register: `POST /clients/register` ([`app/api/clients.py`](app/api/clients.py:14))
- Therapist register: `POST /therapists/register` ([`app/api/therapists.py`](app/api/therapists.py:68))
- Login-by-id:
  - client: `GET /clients/{id}` ([`app/api/clients.py`](app/api/clients.py:32))
  - therapist: `GET /therapists/{id}` ([`app/api/therapists.py`](app/api/therapists.py:98))

## Common commands

Frontend (from [`frontend/`](frontend:1))

```bash
npm run dev -- --host
npm run lint
npm run build
```

## Troubleshooting

### Browser registration/login fails with generic network errors

If the API is reachable via curl but the browser fails, it is usually a CORS/preflight issue.

- CORS middleware is configured in [`app/main.py`](app/main.py:1).
- Frontend base URL is configured in [`frontend/src/services/env.ts`](frontend/src/services/env.ts:1).
