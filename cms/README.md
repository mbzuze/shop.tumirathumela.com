# TumiraCMS

Self-hosted headless CMS for `shop.tumirathumela.com`. Runs on
`admin.tumirathumela.com`, with uploaded media served from its own
`/public/media` directory (same domain, `/media/...` path).

**Stack:** Next.js 15 · Prisma 5 · PostgreSQL 16 · Redis 7 · Clerk · Tiptap · @dnd-kit

Deploys as a subdirectory of the `shop.tumirathumela.com` monorepo, as a
separate cPanel "Setup Node.js App" (Passenger) process on the shared
production server. See the repo root `README.md` and (local, gitignored)
`SERVER-ACCESS.md` for full server access details.

---

## cPanel deployment (production)

### 1. Native PostgreSQL + Redis

Installed once, server-wide, bound to `127.0.0.1` only (not per-app, not
Docker — this is a shared cPanel box). See `SERVER-ACCESS.md` /
`SERVER-CREDENTIALS.md` for the actual production credentials.

### 2. cPanel "Setup Node.js App"

- Application root: this `cms` directory as deployed under
  `~/public_html/admin.tumirathumela.com` (or wherever the Node App's root is
  configured to point).
- Application startup file: `server.js` (a small Passenger-compatible
  entrypoint using Next's programmatic API — Passenger spawns a Node script
  directly, it doesn't run `npm start`).
- Environment variables: set via the Node App UI — see the table below.
  Never commit real secrets to `.env`.

### 3. Database setup

```bash
npm ci
npx prisma migrate deploy
```

### 4. Media directory

Media is written to and served from this app's own `public/media` — no
separate media domain, no nginx. Just make sure the directory is writable by
the app process:

```bash
mkdir -p public/media
chmod 755 public/media
```

### 5. Backups (cron)

```bash
chmod +x scripts/backup.sh
crontab -e
```

Add:
```
0 2 * * * MEDIA_ROOT=/path/to/cms/public/media /path/to/cms/scripts/backup.sh >> /var/log/tumiracms-backup.log 2>&1
```

Backups go to `/var/backups/tumiracms/` and are retained for 14 days.

### 6. Clerk setup

1. Create a Clerk application at [clerk.com](https://clerk.com).
2. Set **Allowed callback URLs**: `https://admin.tumirathumela.com`
3. Add `admin` and `editor` to `publicMetadata` for each CMS user (via Clerk dashboard or API).
4. Copy the API keys into the Node App's environment variables.

To grant admin access to a user:
```bash
# Clerk dashboard → Users → click user → Public metadata
{ "role": "admin" }
# or
{ "role": "editor" }
```

---

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (native, localhost) |
| `REDIS_HOST` | Redis host (default `127.0.0.1`) |
| `REDIS_PORT` | Redis port (default `6379`) |
| `REDIS_PASSWORD` | Redis password |
| `MEDIA_ROOT` | Absolute path for uploaded media (defaults to `<app>/public/media`) |
| `MEDIA_URL` | Public base URL for media (`https://admin.tumirathumela.com/media`) |
| `CMS_API_KEY` | Secret key for public API (`X-CMS-API-Key` header) |
| `CMS_API_URL` | Base URL of this CMS (`https://admin.tumirathumela.com`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |

---

## API

### Public API (requires `X-CMS-API-Key` header)

```
GET /api/cms/v1/products
GET /api/cms/v1/products/:slug
GET /api/cms/v1/categories
GET /api/cms/v1/categories/:slug
GET /api/cms/v1/collections/:slug
GET /api/cms/v1/search?q=...
GET /api/cms/v1/brands
GET /api/cms/v1/hero-banners
GET /api/cms/v1/homepage
GET /api/cms/v1/settings/:key
GET /api/cms/v1/sales/:coupon
```

Rate limit: **100 req/min** per IP.

### Admin API (requires Clerk JWT with `admin` or `editor` role)

```
/api/cms/v1/admin/products   (CRUD + publish/revisions)
/api/cms/v1/admin/categories (CRUD)
/api/cms/v1/admin/media      (upload/delete)
/api/cms/v1/admin/brands     (CRUD)
/api/cms/v1/admin/collections (CRUD)
/api/cms/v1/admin/hero-banners (CRUD + reorder)
/api/cms/v1/admin/homepage-sections (CRUD + reorder)
/api/cms/v1/admin/orders     (list + status update)
/api/cms/v1/admin/reviews    (approve/reject/delete)
/api/cms/v1/admin/sales      (CRUD)
/api/cms/v1/admin/webhooks   (CRUD + test)
/api/cms/v1/admin/settings   (upsert)
```

Rate limit: **500 req/min** per IP.

---

## Deployment checklist

- [ ] Native PostgreSQL + Redis installed and hardened (localhost-only)
- [ ] Node App environment variables set in cPanel (never committed)
- [ ] `npm ci && npx prisma migrate deploy` run
- [ ] `npm run build`, Node App started via cPanel, logs clean
- [ ] `public/media` exists and is writable
- [ ] Backup cron registered
- [ ] Clerk admin users have `role: "admin"` in publicMetadata
- [ ] Shop's `.env` on the server has matching `CMS_API_URL` / `CMS_API_KEY`
- [ ] AutoSSL certificate issued for `admin.tumirathumela.com`
