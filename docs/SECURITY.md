# Security model

This document describes how the system protects data and money, what is
enforced where, and the checks to run before going live.

## Trust boundaries

| Boundary | Untrusted | Trusted |
| -------- | --------- | ------- |
| Menu browsing | The browser, the request | Postgres catalog tables (read-only to public) |
| Order creation | The entire cart payload | `public.create_order(jsonb)` — recomputes every price |
| Order status | The browser | `public.update_order_status` — validates the flow |
| Payment confirmation | The browser | `public.confirm_payment` — role-gated |
| Staff roles | The browser | `public.profiles.role` — never settable by the client |

The client may *ask*, never *assert*. The database decides.

## Non-negotiables

1. **The service-role key never ships to the browser.** Only
   `VITE_SUPABASE_ANON_KEY` is used client-side, and every table has RLS.
2. **No price, discount, total, tax, role, or payment status is trusted from
   the client.** `create_order` looks up each item and modifier in the catalog
   and computes `unit_price`, `line_total`, `subtotal`, `tax_total`, and
   `total` itself.
3. **Orders are transactional.** The order row, its items, modifiers, status
   event, and payment row are written inside a single function call.
4. **Tracking tokens are unguessable** (40 uppercase hex characters). A token
   reveals exactly one order (`get_order_by_token`), never the order list.
5. **Order status and payment status are separate** and cannot be set to
   arbitrary values; transitions are validated by `is_valid_transition`.
6. **Tax and service charge default to 0** and are opt-in. No rate is invented.

## Database controls

- **RLS enabled on all tables.** Key policies:
  - Catalog, settings, and table tokens: public `SELECT` (they are not secrets).
  - `cafe_tables`: public `SELECT` so a scanned QR token can be resolved.
    A leaked token only pre-fills a table; it grants no elevated access and no
    ability to read other guests' orders.
  - Orders, items, modifiers, events, payments, audit logs: staff-only `SELECT`.
  - Writes to orders/payments happen only through `SECURITY DEFINER` functions.
- **Functions pin `search_path`** (`set search_path = public`) to prevent
  search-path hijacking.
- **Function grants are minimal.** Customer RPCs (`create_order`,
  `get_order_by_token`, `resolve_table_by_token`) are executable by `anon`;
  staff RPCs by `authenticated`; internal helpers (`log_audit`,
  `order_to_json`, `is_valid_transition`) are revoked from everyone.
- **Role checks live in SQL**, not only in the UI. Each staff RPC re-checks
  the caller's role even though the UI also hides those actions.

## Realtime and privacy

Administrative realtime subscriptions run as authenticated staff and are
covered by the staff `SELECT` policy on `orders`.

The guest tracking page does **not** rely on anon Realtime (which RLS would
correctly suppress). It polls `get_order_by_token` on an interval, so status
updates appear without exposing any other order.

## Local demo mode — what it is and is not

- It stores data in `localStorage` under keys prefixed `bb.`.
- It is an **offline simulation** for evaluation and development.
- It is **not** a secure store: anyone with the browser profile can read it.
  Do not enter real customer data or real payment credentials in demo mode.

## Pre-launch checklist

- [ ] `.env` uses only the anon/publishable key; no service-role key anywhere.
- [ ] All migrations applied; RLS shows **enabled** on every table.
- [ ] First owner promoted; every other account is least-privilege.
- [ ] Auth email confirmation configured as desired.
- [ ] Tax/service charge values are correct for your jurisdiction (or left off).
- [ ] UPI id in Settings matches the account that should receive payments.
- [ ] Payment confirmation is a manual staff action (no automated capture).
- [ ] Backups enabled in Supabase; retention understood.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` pass.

## Known limitations

- **No payment gateway.** "UPI" records intent and a reference; a staff member
  confirms receipt. No money moves through this app.
- **Table tokens are publicly listable** because the menu and table pages read
  them anonymously. Treat them as per-table public identifiers, not secrets.
- **Staff creation** must go through Supabase Auth (dashboard or Admin API);
  the app can only edit an existing profile's role and active flag.
- **Audit logging** covers privileged RPCs; direct dashboard edits are not
  captured by the app's audit log.
