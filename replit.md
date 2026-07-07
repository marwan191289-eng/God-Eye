# WAR ROOM

A probability-driven crypto trading intelligence platform with multi-layer signal scoring, regime-filtered analysis, 20+ technical indicators, and ATR-based risk management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind v3 (postcss) + shadcn/ui + react-router-dom v6
- Auth: Clerk (whitelabel, proxied via `/clerk` path)
- API: Express 5 + Clerk middleware
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/war-room/` — React frontend (Vite, port from `$PORT`)
- `artifacts/api-server/` — Express API server (port 8080)
- `lib/db/` — Drizzle ORM schema and client (`profiles`, `userRoles`, `signalLog`)
- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 spec (source of truth for all API contracts)
- `artifacts/api-client-react/src/generated/` — auto-generated React Query hooks
- `lib/api-zod/src/generated/` — auto-generated Zod schemas
- `artifacts/war-room/public/war-room.html` — the original iframe trading dashboard

## Architecture decisions

- Supabase (auth + DB) replaced with Clerk (auth) + Replit Postgres + Drizzle ORM
- Lovable `@lovable.dev/cloud-auth-js` removed; Clerk handles Google OAuth and email/password
- Admin panel uses generated React Query hooks (`useAdminCheck`, `useAdminListUsers`) instead of Supabase RPC calls
- Clerk is proxied through the API server at `/clerk` so the frontend uses a relative URL (avoids CORS issues in the Replit preview proxy)
- All API routes live under `/api`; admin routes require both auth + admin role check middleware

## Product

- Real-time crypto signal matrix across BTC, ETH, SOL and more
- Multi-timeframe technical analysis (EMA, MACD, RSI, CCI, MFI, ADX, Ichimoku, SAR)
- Market regime detection and sentiment scanning
- Admin panel (Arabic RTL UI) for user and signal management
- Authentication via Clerk (email/password + Google OAuth)

## User preferences

- Arabic RTL UI for auth/admin pages
- Keep all Supabase/Lovable references removed — use Clerk + Postgres + Drizzle only

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks
- `war-room.html` in `public/` is served as a static file; it is the original trading dashboard loaded via iframe in `Index.tsx`
- Clerk peer dependency warnings on React 19.1.0 are harmless (Clerk targets ~19.0.3)
- The `@clerk/react` `publishableKeyFromHost` utility selects between dev/prod Clerk keys based on hostname

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
