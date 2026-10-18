# Deployment guide

## Prerequisites

- Node.js 20+ and npm
- A Supabase project (optional; the app also runs in local demo mode)
- A static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 + CDN, …)

## 1. Configure environment

Create `.env` from `.env.example` and set the **public** Supabase values:

```
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

If these are missing or look like placeholders, the build falls back to local
demo mode. Vite inlines `VITE_*` values at build time — rebuild after changes.

## 2. Apply database migrations

```powershell
supabase link --project-ref <your-ref>
supabase db push
```

Or run `supabase/migrations/*.sql` in filename order via the SQL editor. After
applying, create the first staff user and promote them:

```sql
update public.profiles set role = 'owner' where email = 'you@example.com';
```

## 3. Build

```powershell
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Output is written to `dist/`.

## 4. Host the static build

The app is a single-page app with client-side routing, so configure a rewrite
that serves `index.html` for unknown paths.

**Netlify** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel** (`vercel.json`):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Static servers (nginx):**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 5. Print table QR codes

Sign in as an owner or manager, open **Admin → Tables**, and use **Print** or
**Download** for each table. Each QR encodes `<your-domain>/t/<token>`. Rotating
a token immediately invalidates every previously printed copy of that table's
QR code.

## 6. Post-deploy checks

- Visit the site; the demo banner should be gone (Supabase detected).
- Scan a table QR code and place a test order end to end.
- Confirm the order appears on the staff order board in real time.
- Advance it through the status flow and confirm payment.
- Verify a second order's tracking link cannot open the first order.

## Environment variable reference

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `VITE_SUPABASE_URL` | For live mode | Public project URL |
| `VITE_SUPABASE_ANON_KEY` | For live mode | Public anon/publishable key |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Optional | Used only if the anon key is absent |

Never add a service-role key to any `VITE_*` variable.

## Operations

- **Backups:** enable automated backups in Supabase.
- **Migrations:** always add new SQL files; never edit already-applied ones.
- **Upgrades:** run the full lint/typecheck/test/build gate before releasing.
- **Rotating a leaked table token:** Admin → Tables → Regenerate, then reprint.
