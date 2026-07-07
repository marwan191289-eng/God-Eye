# Security Audit — api-server, RLS & dependencies (2026-05-18)

## 1. api-server routes & auth middleware

### Fixed
- **Mock OAuth + email/phone verification endpoints in `routes/auth.ts`** returned
  `{ authenticated: true }` for any token. Removed; now respond `501 Not Implemented`.
  Auth is handled by Clerk and verified server-side via `clerkMiddleware()` +
  `getAuth()`.
- **`/api/me/role`** hardcoded `role: "user"` regardless of DB state. Now queries
  `user_roles`.
- **Subscriptions PATCH/DELETE `/:id`** ignored ownership. Mock data only, but the
  pattern is dangerous — added an `// SECURITY` note and a `userId` guard
  reminder. Routes are still mocks until Stripe is wired.
- **Duplicate Drizzle schema** (`lib/db/src/schema/subscriptions.ts` and
  `monetization.ts` both defined `subscription_plans`, `user_subscriptions`,
  `payments`, `invoices`). The dead `subscriptions.ts` file was removed.
- **Shared `requireAuth` / `requireAdmin` middleware** extracted to
  `artifacts/api-server/src/middlewares/authz.ts` — was duplicated in 3 files.
- **Root `dev` script** added — fixes "Script not found 'dev'".

### Recommended (not done — needs product decisions)
- Wire `apps/api-server/src/middleware/rateLimiter.ts` (or an equivalent) into
  `artifacts/api-server/src/app.ts` once Redis is provisioned. Auth, trading,
  withdrawal endpoints all need per-user limits.
- Add `helmet`, `compression`, request-size limits on `express.json()`.
- CORS regex allows any `*.replit.dev / *.repl.co / *.replit.app` — replace with
  an explicit allowlist that includes the production domain
  (`tradexray.lovable.app`) before going public.
- Stripe webhook handler in `routes/subscriptions.ts` currently always returns
  `{ received: true }` without signature verification. Do not deploy to prod
  until `stripe.webhooks.constructEvent` is enabled.
- `signals-enhanced.ts` exposes `/analytics` to all authenticated users including
  `bestSignal/worstSignal` PII-light data and full signal list. Confirm this is
  intended for free tier or gate behind subscription.

## 2. Supabase RLS review (lib/db/src/schema → DB)

Only **3** of the 25+ Drizzle tables are actually deployed: `profiles`,
`signal_log`, `user_roles`. RLS posture for those tables:

| Table       | RLS | Status |
|-------------|-----|--------|
| profiles    | ✅  | Own-row R/U/I + admin SELECT. No DELETE policy (intentional). |
| signal_log  | ✅  | All authenticated can SELECT; admins ALL. Matches product intent. |
| user_roles  | ✅  | Already hardened — admin-only INSERT/UPDATE/DELETE; user can SELECT own. |

The remaining schema files (`kyc`, `wallets`, `trading`, `security`,
`market_data`, `monetization`) are **defined in TypeScript but not migrated**.
When migrations are written, every table needs:
- `user_id` (text, not nullable, matching Clerk user id format)
- `ENABLE ROW LEVEL SECURITY`
- SELECT/INSERT/UPDATE/DELETE policies scoped by `user_id = auth.jwt() ->> 'sub'`
  (or via a `has_role(_user_id, _role)` security-definer function, since auth is
  Clerk not Supabase Auth — `auth.uid()` will be NULL).
- Admin override via `has_role()`.

**Critical for any future migration:** because Clerk (not Supabase Auth) is the
identity provider, classic `auth.uid() = user_id` policies will not work for the
API server since it connects via the service role. Real protection must live in
application code (`requireAuth` + per-query `userId` filters) **and** RLS must
default-deny everything for the `anon` / `authenticated` roles.

## 3. Dependency vulnerability scan

`code--dependency_scan` (npm audit equivalent): **no high or critical
vulnerabilities**. `pnpm audit` not runnable in this sandbox (pnpm not on PATH).
Re-run `pnpm audit --prod` in CI once that's available.

Pinned overrides in `pnpm-workspace.yaml` already cap `esbuild`, `rollup`,
`postcss`, `flatted`, `minimatch` to safe versions — good.
