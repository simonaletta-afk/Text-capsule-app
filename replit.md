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
- **Auth**: Replit Auth (OpenID Connect with PKCE)

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

Express 5 API server with Replit Auth and messages API.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, cookie-parser, JSON parsing, auth middleware, routes at `/api`
- Routes: health, auth (Replit OIDC), messages (CRUD)
- Auth: `src/lib/auth.ts` (session mgmt), `src/middlewares/authMiddleware.ts`
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `artifacts/future-letter` (`@workspace/future-letter`)

Expo React Native mobile app — "Future Letter". Users write messages to their future selves, delivered after 6 months or 1 year.

- Uses Expo Router for file-based routing
- Auth via `lib/auth.tsx` (expo-auth-session + SecureStore)
- API client in `lib/api.ts`
- Screens: index (home/login), compose (write new letter), message/[id] (view letter)

### `lib/db` (`@workspace/db`)

Database layer: Drizzle ORM + PostgreSQL.

- Tables: `users`, `sessions` (auth), `messages` (future letters)
- Push schema: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config.

- Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` / `lib/api-client-react`

Generated Zod schemas and React Query hooks from OpenAPI spec.
