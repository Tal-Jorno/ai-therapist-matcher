# AI Therapist Matcher Frontend

React + Vite + TypeScript frontend (Hebrew RTL UI) for the AI Therapist Matcher project.

## Run

From repo root:

```bash
cd frontend
npm install
npm run dev -- --host
```

## Build / lint

```bash
npm run lint
npm run build
```

## API base URL

The frontend calls the backend using [`env.apiBaseUrl`](frontend/src/services/env.ts:1).

- Default: `http://localhost:8000`
- Override with: `VITE_API_BASE_URL`

## Auth/session

Auth/session is implemented in a single module: [`frontend/src/auth/types.ts`](frontend/src/auth/types.ts:1).

Routes are protected in [`frontend/src/App.tsx`](frontend/src/App.tsx:1) using [`RequireRole`](frontend/src/auth/types.ts:130).

For full system instructions, see the repo root README: [`README.md`](../README.md:1).
