# Brew & Bean · Cafe QR Table Ordering

A premium, production-shaped QR ordering system for cafes and restaurants.
Guests scan a table QR code, browse the menu, customise items, place an order,
and track its progress. Staff manage orders, the menu, tables, payments,
reports, and settings from a role-gated admin dashboard.

Built with React 19, Vite, TypeScript (strict), Tailwind CSS v4, and optional
Supabase (Postgres + Auth + Row Level Security + Realtime).

> **Runs with zero configuration.** Until you provide Supabase credentials the
> app runs in a clearly-labelled *Local demo mode* backed by `localStorage`.
> It never claims to be connected to a real database.

---

## Features

### Guest experience
- Landing page with table-scan entry, featured items, and cafe details.
- Menu browser with category tabs, search, item images, tags, and allergen notes.
- Item detail dialog with variants and modifier groups (required / optional,
  single / multi-select) and live price preview.
- Persistent cart (survives refresh) with quantity editing and notes.
- Checkout with table context, customer details, and payment choice
  (UPI or pay at counter).
- Order tracking page with status timeline, live refresh, and payment badge.

### Staff dashboard
- Email + password sign-in (Supabase Auth) with a local demo fallback.
- Role-based access control: `owner`, `manager`, `cashier`, `kitchen`.
- Order board with status filters, search, and one-tap status advancement.
- Order detail with item breakdown, timeline, and payment confirmation.
- Menu manager: categories, items, variants, tags, availability, featured flags.
- Modifier manager: groups and options with min/max selection rules.
- Tables manager: create tables, generate/print/download QR codes, rotate tokens.
- Reports: sales, paid/pending totals, average order value, top items, daily trend.
- Staff manager (owner): assign roles and activate/deactivate.
- Settings: cafe identity, UPI id, currency, tax, and service charge.
- Audit log of privileged actions (owner/manager).

### Correctness & security
- **Prices are never trusted from the client.** Totals are recomputed inside a
  Postgres function (`create_order`) from the live catalog.
- Orders are written in one transaction (order → items → modifiers → payment).
- Unguessable 40-character tracking tokens; guests see only their own order.
- Separate **order status** and **payment status** with a validated transition flow.
- Row Level Security on every table; all writes via `SECURITY DEFINER` functions
  with pinned `search_path`.
- Tax and service charge are **off by default** (no invented rates).

---

## Quick start

```powershell
npm install
npm run dev
```

The app opens in **Local demo mode** and is fully usable.

### Demo staff accounts (local mode)

| Role    | Email                    | PIN  |
| ------- | ------------------------ | ---- |
| Owner   | owner@brewandbean.test   | 2468 |
| Manager | manager@brewandbean.test | 1357 |
| Cashier | cashier@brewandbean.test | 1122 |
| Kitchen | kitchen@brewandbean.test | 3344 |

A sample QR token for table 1 is `DEMOTABLE01XXXXXXXX`. Visit `/t/DEMOTABLE01XXXXXXXX`.

---

## Connecting a real Supabase project

1. Create a project at <https://supabase.com>.
2. Copy `.env.example` to `.env` and fill in the **public** values:
   ```
   VITE_SUPABASE_URL=https://<your-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
   Never put the service-role key in this file.
3. Apply the migrations in `supabase/migrations/` (see below).
4. Create your first staff user (Auth → Users), then promote them to owner:
   ```sql
   update public.profiles set role = 'owner' where email = 'you@example.com';
   ```
5. Restart `npm run dev`. The demo banner disappears and the app uses Supabase.

### Applying migrations

Using the Supabase CLI:

```powershell
supabase link --project-ref <your-ref>
supabase db push
```

Or paste each file in `supabase/migrations/` in order into the SQL editor.

> Migrations are **not** applied automatically by this project. They are inert
> SQL files until you choose to run them.

---

## Scripts

| Script                  | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Start the dev server                       |
| `npm run build`         | Type-check and build for production        |
| `npm run preview`       | Preview the production build               |
| `npm run lint`          | ESLint                                     |
| `npm run typecheck`     | TypeScript project build (no emit)         |
| `npm run test`          | Run the Vitest suite once                  |
| `npm run test:watch`    | Run Vitest in watch mode                   |
| `npm run test:coverage` | Run tests with a coverage report           |

---

## Project structure

```
src/
  app/          App shell, providers, router, layouts, route guards
  components/   UI primitives, layout chrome, feedback, RoleGate
  data/
    demo/       Seed catalog, tables, settings, staff for local mode
    local/      localStorage-backed store with pub/sub
  features/     Cart, auth, toast, table session, menu, admin, tracking, settings
  lib/          Pure logic: pricing, orders, permissions, env, formatting, storage
  pages/        Route pages (guest + staff + admin)
  services/     Data access; switches between Supabase and local demo
  types/        Domain types mirrored by the SQL schema
  test/         Vitest setup and render helpers
supabase/
  migrations/   Versioned SQL (schema, functions, RLS, grants, seed)
docs/
  SECURITY.md   Threat model and hardening checklist
  DEPLOYMENT.md Build and hosting guide
```

---

## Tech stack

- React 19 + React Router v7
- TypeScript (strict, `verbatimModuleSyntax`)
- Vite 8 + Tailwind CSS v4
- Supabase JS v2 (auth, database, realtime)
- Vitest + Testing Library
- ESLint (flat config) + typescript-eslint

---

## Documentation

- [`docs/SECURITY.md`](docs/SECURITY.md) — security model and checklist
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment and operations
