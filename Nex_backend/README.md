# Nex_backend

Real backend for the Nex suite — ERP + B2B marketplace + shopper storefront —
replacing the frontend's in-memory mock with Express + PostgreSQL.

- **ERP / marketplace API** — `/api/v1/*` — 143 routes across 20 routers
- **Storefront API** — `/api/v1/shop/*` — shopper sessions are a separate
  identity space (`typ: "shopper"` tokens, 30 days)

## Stack

Express 5 · pg (Postgres) · zod · jsonwebtoken · bcrypt (via `utils/password.js`)

## Contract rules

The frontend's mock server (`Nex_main/removed-mock-data/src/services/mock/server.js`)
**is the specification**: same paths, same payloads, same validation messages,
same status codes.

- Success responses are always `{ "success": true, "data": <payload> }`.
  Errors are always `{ "success": false, "message": "..." }` (plus an
  `errors` list for zod failures) — produced centrally by
  `src/middleware/error.middleware.js`.
- Domain routers carry the **full contract path** (e.g.
  `/vendor/:vendorId/orders`) and mount at `/api/v1`; only `auth`, `users`
  and `products` mount at a sub-prefix.
- Validation messages are byte-identical to the mock (e.g.
  `Email and password are required`, `Customer and at least one line are
  required`, `Invalid email or password`).

### Deliberate deviations from the mock

The mock ran in-memory with plaintext credentials; a real backend closes a
few holes without changing any response shape:

| Endpoint | Deviation |
|---|---|
| `POST /auth/forgot-password` | also returns `resetToken` (additive) so the ERP can complete the reset flow |
| `POST /auth/reset-password` | validates the token against `password_reset_tokens` and that it belongs to the emailed account (the mock accepted any string) |
| `POST /auth/change-password` | verifies `currentPassword` against the stored hash before updating (the mock never checked) |
| `POST /auth/register` | accepts marketplace `username` **or** ERP `name`; `company` may be a string or `{name, industry, plan}` (find-only vendor match → `VENDOR_ADMIN`, else `SUPER_ADMIN`) |
| passwords | stored as bcrypt hashes (`password_hash`), never plaintext |

## Quick start

```bash
# .env (required keys — see src/config/env.js)
PORT=5000
DB_HOST=...  DB_PORT=5432  DB_NAME=...  DB_USER=...  DB_PASSWORD=...
JWT_ACCESS_SECRET=...  JWT_REFRESH_SECRET=...
# optional: JWT_ACCESS_EXPIRES_IN (default 15m), JWT_REFRESH_EXPIRES_IN (default 7d)

npm install

# full rebuild from scratch
node scripts/reset-db.mjs      # DROP + CREATE schema public
node src/database/migrate.js   # 40 migrations (src/database/migrations/*.sql)
npm run seed                   # 4 seeds: RBAC (70/12/265) + demo data
node scripts/db-check.mjs      # row counts + bcrypt login verification

npm start                      # or: npm run dev (nodemon)
```

Server: `http://localhost:5000` — `GET /` → `{message: "Welcome to NexERP API"}`.

## Project layout

```
src/
  app.js                 mounts every router (assistant-owned file)
  server.js              listen + process handlers
  routes/api/v1/         20 routers — thin path registrations only
  controllers/           asyncHandler request/response logic
  services/              business rules, contract payloads
  repositories/          table() query layer + auth SQL
  middleware/            attachUser, context (requireUser/requireVendor),
                         shopContext (shopper helpers), validate, error
  schemas/               zod body shapes (messages live in services)
  errors/                AppError + api.errors helpers (notFound/badRequest/…)
  utils/                 http (paginate/sort/nowISO), money, workflow
                         (state maps), password (bcrypt), jwt
  database/              migrate.js, seed.js, migrations/*.sql, seeds/*.sql
scripts/
  smoke.mjs              auth + envelope contract checks (38)
  smoke-domains.mjs      calls every GET route — no 5xx allowed (71)
  smoke-writes.mjs       calls every mutating route with {} (65)
  reset-db.mjs           drop/create schema public
  db-check.mjs           row counts + login verification
  gen-schema.mjs         regenerate migrations from frontend-seed.json
  gen-rbac-seed.mjs      regenerate 001–003 RBAC seeds
  gen-data-seed.mjs      regenerate 004 demo data (bcrypt, position, "order")
```

`table()` in `src/repositories/table.js` translates `?`→`$n` and camelCase→
snake_case, preserving `AS camelAlias`, quoted segments and function names.

### Routers

| Router | Routes | | Router | Routes |
|---|---:|---|---|---:|
| shop | 24 | | finance | 9 |
| admin | 12 | | purchase | 9 |
| hr | 11 | | catalog | 8 |
| sales | 10 | | auth | 8 |
| users | 6 | | inventory | 7 |
| ticket | 6 | | project | 7 |
| customer | 5 | | crm | 4 |
| expense | 5 | | supplier | 4 |
| platform | 5 | | dashboard | 1 |
| report | 1 | | products | 1 |
| **total** | | | | **143** |

## Demo credentials

| Account | Password | Notes |
|---|---|---|
| `super@nexiv.app` | `NeXiv-2026-Super#K` | SUPER_ADMIN, no tenant (`vendor: null`) |
| `david.eze@primeofficesupplies.ng` | `NeXiv-2026-ChangeMe#K` | VENDOR_ADMIN @ v-01 (Prime Office Supplies) |
| `accountant@primeoffice.ng` | `NeXiv-2026-Acct#K` | ACCOUNTANT @ v-01 |
| `chidinma.okeke@gmail.com` | `ShopDemo-2026#K` | storefront shopper |

## Test suites

```bash
node scripts/smoke.mjs          # 38/38 — auth contract + envelope + products order
node scripts/smoke-domains.mjs  # 71/71 — every GET route, zero 5xx
node scripts/smoke-writes.mjs   # 65/65 — every POST/PATCH/PUT/DELETE, zero 5xx
```

`smoke-writes.mjs` intentionally creates junk rows (empty bodies, garbage ids)
— reseed afterwards with the quick-start pipeline. All three boot the app on
an ephemeral port and clean up after themselves.

## Frontend wiring

The two former frontends are now **one merged app** at `Nex_main/Nex`
(storefront under `src/marketplace/`, workspace under `src/`). It reads both
env keys, both pointing at this backend:

| Consumer | Base URL | Unwrap layer |
|---|---|---|
| Workspace (RTK Query) | `VITE_API_URL=http://localhost:5000/api/v1` | `src/services/baseQuery.js` |
| Storefront (`src/marketplace`) | `VITE_API_BASE_URL=http://localhost:5000/api/v1` | `src/marketplace/api/client.js` `apiFetch` |

Both halves see contract-shaped data after the central unwrap — components
read `{user, vendor, accessToken, ...}` exactly as they did against the mock.

Originals kept as backups: `Downloads/React_project/Nex-IV` (standalone
storefront) and `Nex_main/.backup-Nex-premerge` (pre-merge ERP).
