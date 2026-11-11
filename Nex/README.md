# Nex-IV — merged app

One React app that combines both previous UIs and talks to the real backend
(`../Nex_backend`, port 5000).

## What's where

- **Storefront** (former `Downloads/React_project/Nex-IV`) lives in
  `src/marketplace/` and renders under a shop shell (header, footer, cart
  context, scroll handling): `/home`, `/search`, `/categories…`,
  `/product/:id`, `/vendor/:id`, `/cart`, `/checkout…`, `/account…`,
  `/wishlist`, `/faq`, `/about`.
- **Workspace / ERP** (this folder's original tree, URLs unchanged):
  `/dashboard`, `/admin…`, `/me…`, `/customers`, `/sales/*`,
  `/purchasing/*`, `/inventory/*`, `/finance/*`, `/hr/*`, `/projects`,
  `/tasks`, `/support/*`, `/reports`, `/settings/*`, `/notifications`.
- **One auth system**: `/login`, `/register`, `/forgot-password`,
  `/reset-password` (the storefront's legacy `/auth` redirects to `/login`).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

The backend must be running first — `Nex_backend` on
`http://localhost:5000` (see `../Nex_backend/README.md`).
`.env.local` defines both env keys the app reads:

```
VITE_API_URL=http://localhost:5000/api/v1          # workspace (RTK Query)
VITE_API_BASE_URL=http://localhost:5000/api/v1     # storefront (apiFetch)
```

## How the two halves share a session

- Canonical token/user: Redux, persisted as `localStorage["nexiv.auth.v1"]`.
- Storefront view: `localStorage["nexivCurrentUser"]` (display + role).
- `src/app/sessionBridge.js` keeps them in sync in **both** directions —
  signing in or out from either UI updates the other.
- `/` is a role-aware landing gate (`src/app/RootIndexGate.jsx`):
  workspace sessions open `/dashboard` (platform → `/admin`, employee →
  `/me`), everyone else lands on `/home`.
- Cross links: the workspace sidebar has **Storefront → `/home`**; the
  storefront account menu has a role-gated **Workspace → `/dashboard`**.

## Verify

- `npm run lint` — union of both apps' original baselines (45 errors /
  10 warnings, all pre-existing), nothing new.
- `npm run build` — passes.

Originals kept as backups: the standalone storefront in
`Downloads\React_project\Nex-IV`, and the pre-merge ERP copy in
`Nex_main\.backup-Nex-premerge`.
