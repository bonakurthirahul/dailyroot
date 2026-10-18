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
