# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with Expo Router
- **Auth**: Custom email + password (bcryptjs for hashing, session tokens in DB)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── future-letter/      # Expo React Native mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` during typecheck; bundling handled by esbuild/tsx/vite
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in `references`

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with custom auth, messages API, and Twilio SMS/WhatsApp delivery.

- Entry: `src/index.ts` — reads `PORT`, starts Express, starts delivery scheduler
- App setup: `src/app.ts` — mounts CORS, cookie-parser, JSON parsing, auth middleware, routes at `/api`
- Routes: health, auth (email/password signup + login + logout + user), messages (CRUD), phone (GET/POST phone number), support (POST contact form)
- Auth: `src/lib/auth.ts` (session mgmt with random tokens stored in DB), `src/middlewares/authMiddleware.ts` (Bearer token + cookie support)
- Auth endpoints: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/user, POST /api/auth/logout
- Twilio: `src/lib/twilio.ts` (Twilio client via Replit integration connector or env vars)
- Delivery: `src/lib/deliveryJob.ts` — polls every 60s for messages past their delivery date, sends WhatsApp/SMS via Twilio, marks as delivered
- Depends on: `@workspace/db`, `@workspace/api-zod`, `twilio`, `bcryptjs`

### `artifacts/future-letter` (`@workspace/future-letter`)

Expo React Native mobile app — "Text Capsule". Users write messages to their future selves, delivered as WhatsApp/SMS after 6 months or 1 year.

- Uses Expo Router for file-based routing
- Auth via `lib/auth.tsx` (email/password login, token stored in expo-secure-store)
- API client in `lib/api.ts` (Bearer token auth)
- Screens: index (home/login with email+password form), compose (write new message), phone-setup (enter phone number + delivery channel), message/[id] (view message), settings (profile + menu), privacy (privacy policy), support (contact form)
- Phone setup: prompted after first login if no phone number set
- Color scheme: indigo primary (#6366F1), iMessage green (#34C759) for app icon

### `lib/db` (`@workspace/db`)

Database layer: Drizzle ORM + PostgreSQL.

- Tables: `users` (with email, passwordHash, phoneNumber, deliveryChannel), `sessions` (auth), `messages` (future messages)
- Push schema: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config.

- Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` / `lib/api-client-react`

Generated Zod schemas and React Query hooks from OpenAPI spec.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provided)
- `TWILIO_ACCOUNT_SID` — Twilio account SID
- `TWILIO_AUTH_TOKEN` — Twilio auth token
- `TWILIO_PHONE_NUMBER` — Twilio sending phone number (+447307240645)
