# Digital Menu (DigiMenu)

A restaurant **digital menu** web app: guests open the menu after scanning a table QR code; staff manage categories, dishes, hero branding, and QR entry URLs from a password-protected **dashboard**. Built with **Next.js 16** (App Router), **React 19**, **Supabase** (Postgres, Auth, Storage), **Tailwind CSS v4**, and optional **Sentry** error monitoring.

## Features

- **Guest flow**
  - Home (`/`) prompts to scan a QR code (in-browser camera via `@yudiel/react-qr-scanner`).
  - Valid codes point to same-origin **`/enter`**, which sets an **HTTP-only, signed cookie** (`menu_access`) and redirects to **`/menu`**.
  - The cookie lasts **12 hours** and is verified with **HMAC-SHA-256** using `MENU_ACCESS_SECRET`.
  - **`/menu`** is a virtualized, searchable menu with categories, hero header, product detail dialog, and dark/light theme.
- **Staff dashboard** (Supabase Auth — email/password)
  - **`/dashboard`** — overview counts.
  - **`/dashboard/categories`** — categories and sort order.
  - **`/dashboard/menu-items`** — CRUD, image upload to Supabase Storage.
  - **`/dashboard/hero`** — branding (logo, copy, background image URL).
  - **`/dashboard/qr`** — copy per-table **`/enter`** URLs; configure max table count (`app_settings`).
  - **`/dashboard/export-import`** — JSON snapshot export/import (replace or merge).
- **Performance**
  - Initial menu payload is **cached** (`unstable_cache`, 60s, tag `public-menu`) using an **anon** Supabase client so reads stay fast and RLS-safe.
- **Quality**
  - **Vitest** unit tests, **Playwright** E2E tests, **ESLint**, GitHub Actions CI.

## Roadmap (future features)

Planned capabilities that are **not implemented yet**. Status is tracked here for contributors and forks.

| Feature | Summary | Status |
|--------|---------|--------|
| **Table tracking** | Persist which physical table a guest session belongs to (e.g. table id in `/enter` or QR payload), show it in dashboard/KDS, and tie orders or sessions to that table. | Planned |
| **Guest self-ordering** | Let guests build a cart and submit orders from the table **without speaking to staff** — payment (optional), order queue for kitchen/bar, and staff notifications or print integration. | Planned |

**Notes:** Today, QR entry only grants menu access; there is no table identity in the session, cart, or order pipeline. Self-ordering will need new data models (orders, line items, table/session linkage), RLS, and likely a staff-facing order board — design TBD.

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 16.1 (`app/`), TypeScript |
| UI | React 19, Tailwind CSS 4, Lucide icons |
| State (menu UI) | Zustand |
| Data | Supabase JS v2, `@supabase/ssr` |
| Virtual list | `@tanstack/react-virtual` |
| Monitoring | `@sentry/nextjs` (optional) |

## Repository layout

```
app/                    # App Router routes (pages, layouts, route handlers)
components/             # Shared UI (menu, dashboard, QR scanner, etc.)
lib/                    # Supabase clients, menu fetching, cookies, export format, tests
store/                  # Zustand store for menu client state
supabase/migrations/    # SQL snippets (storage RLS, app_settings helpers)
e2e/                    # Playwright specs
proxy.ts                # Next.js 16 request proxy (access control for / and /menu)
```

**Routing note:** This project uses Next.js **16’s `proxy.ts`** convention (similar role to older `middleware.ts`). It redirects unauthenticated guests away from `/menu` and sends users with a valid access cookie from `/` to `/menu`.

## Prerequisites

- **Node.js** 22.x (matches CI; LTS is fine locally if compatible)
- **pnpm** 10 (`corepack enable` or `npm i -g pnpm`)

## Quick start

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and fill in values before relying on Supabase or signed cookies.

Open [http://localhost:3000](http://localhost:3000).

- Without a valid `menu_access` cookie, visiting `/menu` redirects to `/`.
- Visiting `/enter` sets the cookie and redirects to `/menu` (useful for local testing).
- `/dashboard` and `/login` require a Supabase user; configure the database and env vars first.

## Environment variables

Create **`.env.local`** in the project root (never commit secrets).

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Supabase anon (legacy) or publishable key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes* | Preferred public key name (either this or anon key) |
| `MENU_ACCESS_SECRET` | Yes (prod & cookie verification) | Random string **≥ 16 characters**; signs the guest access cookie. Example: `openssl rand -base64 24` |
| `NEXT_PUBLIC_APP_URL` | Recommended in production | Canonical site origin (no trailing slash), e.g. `https://menu.example.com`. Used for QR **enter** URLs in the dashboard when request headers are not enough. |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Client-side Sentry DSN |
| `SENTRY_DSN` | No | Server/Edge Sentry DSN (falls back to `NEXT_PUBLIC_SENTRY_DSN`) |
| `PLAYWRIGHT_BASE_URL` | No | E2E base URL (default `http://127.0.0.1:3000`) |
| `PLAYWRIGHT_WEB_SERVER` | No | Command to start the app for Playwright |
| `PLAYWRIGHT_SKIP_WEBSERVER` | No | Set to skip auto-starting the dev server in Playwright |

\*The code accepts **either** `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `lib/supabase/client.ts` and `lib/supabase/server.ts`).

Use the included **`.env.example`** as a template for `.env.local`.

## Supabase setup

### 1. Create a project

In [Supabase Dashboard](https://supabase.com/dashboard), create a project and note the **URL** and **anon/publishable** key.

### 2. Enable Auth (dashboard login)

The dashboard (`/login` → `/dashboard`) uses **Supabase Auth** with email and password. Guests do **not** sign up; only staff accounts should exist.

1. In the Supabase Dashboard, open **Authentication**.
2. Under **Sign In / Providers**, enable the **Email** provider if it is not already on.
3. On the same **Sign In / Providers** screen, turn **Allow new users to sign up** **OFF**. That way the public app cannot self-register—only accounts you create can sign in.
4. **Create staff accounts manually:** **Authentication → Users** → **Add user** → enter email, password, and confirm. Repeat for each person who needs dashboard access. (You can also use **Invite** if your project supports it.)
5. Under **Authentication → URL configuration**, add your local and production site URLs to **Redirect URLs** as needed.

Use the email and password from a dashboard user to sign in at `/login`.

**No role-based access:** The app does not distinguish admin vs. editor vs. viewer (or similar). Every signed-in user has the **same** dashboard permissions. If you want different credentials—for example, one login per manager—create **separate users** in the Supabase Dashboard; they still share the same single role as far as this codebase is concerned.

### 3. Database tables and RLS

The app expects these **public** tables (names match the code exactly):

**`categories`**

- `id` — `bigint` / `serial`, primary key  
- `name` — `text`, not null  
- `sort_order` — `integer`, not null  

**`menu_items`**

- `id` — `bigint` / `serial`, primary key  
- `category_id` — FK → `categories(id)`  
- `name` — `text`, not null  
- `description` — `text`, nullable  
- `price` — `numeric`, not null  
- `image` — `text`, nullable (public URL)  
- `rating` — `numeric`, nullable  
- `time` — `text`, nullable (e.g. prep time label)  
- `updated_at` — `timestamptz`, optional (used on updates)  

**`hero_section`** (single row, `id = 1`)

- `id` — `smallint` PK, must allow `1`  
- `logo_url`, `name`, `badge_text`, `location_text`, `title`, `subtitle` — `text`, nullable where appropriate  
- `background_image_url` — `text`, not null or default  
- `updated_at` — `timestamptz`, optional  

**`app_settings`** (single row, `id = 1`)

- `id` — `smallint` PK  
- `max_tables` — `smallint`, 1–100  

You can create these in the SQL editor; then enable **RLS** and add policies so that:

- **`anon`** can **`SELECT`** rows needed for the **public menu** (`categories`, `menu_items`, `hero_section`).  
- **`authenticated`** users can **`SELECT` / `INSERT` / `UPDATE` / `DELETE`** on dashboard tables as required by your threat model (typical: full CRUD for signed-in staff only).

The included migrations under `supabase/migrations/` cover:

- Storage policies for the **`menu-items`** bucket  
- `app_settings` row, **`set_app_max_tables` RPC** (`SECURITY DEFINER`), and related policies  

Apply them in order in the SQL editor after you create tables and bucket. See also `supabase/README_STORAGE.md` for the storage bucket checklist.

### 4. Storage (menu images)

1. Create a **public** bucket named **`menu-items`** (see `supabase/README_STORAGE.md` for MIME types and size limits).  
2. Run the policy SQL from `supabase/migrations/20250220000000_create_menu_items_storage.sql` if policies are not already applied.

### 5. Seed data

Insert one **`hero_section`** row with `id = 1` and one **`app_settings`** row with `id = 1` if not created by migrations. Add categories and menu items from the dashboard or via SQL.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (watch) |
| `pnpm test:run` | Vitest once (CI) |
| `pnpm test:e2e` | Playwright (needs env + running app or webServer config) |

## Testing and CI

- **Unit tests:** Vitest + `jsdom` (`vitest.config.ts`).  
- **E2E:** Playwright (`playwright.config.ts`, `e2e/menu.spec.ts`) — asserts `/menu` redirects without cookie, `/enter` sets `menu_access`, and basic menu UI behavior.  
- **GitHub Actions:** `.github/workflows/test.yml` runs lint, unit tests, `next build`, and Playwright with secrets for Supabase URL/keys and `MENU_ACCESS_SECRET`.

Forks should add repository **secrets** matching those env vars for CI to pass.

## Deployment notes

- Set all **required** env vars on the host (e.g. Vercel **Environment Variables**).  
- Set **`NEXT_PUBLIC_APP_URL`** to your production origin so printed QR targets are correct.  
- Ensure **`MENU_ACCESS_SECRET`** is long, random, and stable per environment (rotating it invalidates existing guest cookies).  
- Configure **Supabase Auth** redirect URLs for your production domain.  
- **Sentry:** configure DSNs in the dashboard; source maps are handled by `@sentry/nextjs` when enabled.

## Security overview

- Dashboard routes use **Supabase session** cookies via `@supabase/ssr` server client; unauthenticated users are redirected to `/login`.  
- Guest access uses a **signed, expiring** cookie; verification does not trust client-supplied expiry without signature check.  
- **Never** expose `MENU_ACCESS_SECRET` or service-role keys to the browser; only `NEXT_PUBLIC_*` keys belong in client bundles.  
- RLS policies should enforce which rows **anon** vs **authenticated** roles can read/write.

## Contributing

Issues and pull requests are welcome. Please run `pnpm lint` and `pnpm test:run` before submitting; for UI changes, run E2E when possible.

## License

This project is released under the [MIT License](LICENSE).
