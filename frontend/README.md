# חפשיכולוג (Psychologi) — Frontend

React + Vite + TypeScript frontend (Hebrew RTL UI) for the AI Therapist Matcher project.

Product branding (UI): חפשיכולוג

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

## Google login (optional)

Google login is optional. Email/password login+registration works without it.

To enable Google login:

1. Create a Google OAuth Client ID (Google Cloud Console) for a Web application.
2. Edit [`frontend/public/config.json`](frontend/public/config.json:1) and set:

```json
{
  "googleClientId": "YOUR_CLIENT_ID_HERE"
}
```

3. Restart the frontend dev server (or just refresh the page).

Notes:

- The UI automatically disables the Google button if `googleClientId` is missing.

## API base URL

The frontend calls the backend using [`env.apiBaseUrl`](frontend/src/services/env.ts:1).

- Default: `http://localhost:8000`
- Override with: `VITE_API_BASE_URL`

## Auth/session

Auth/session is implemented in a single module: [`frontend/src/auth/types.ts`](frontend/src/auth/types.ts:1).

Routes are protected in [`frontend/src/App.tsx`](frontend/src/App.tsx:1) using [`RequireRole`](frontend/src/auth/types.ts:130).

For full system instructions, see the repo root README: [`README.md`](../README.md:1).
