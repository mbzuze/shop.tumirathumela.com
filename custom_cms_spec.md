# 🏗️ CUSTOM CMS BUILD SPECIFICATION — TUMIRATHUMELA SHOP

> **PURPOSE:** This document is a comprehensive specification to guide an AI in building a production-ready, fully self-hosted, proprietary CMS to replace Sanity.io for `shop.tumirathumela.com`. Every service runs on the same VPS — no third-party cloud storage, no managed database services, no CDN subscriptions. Read every section before writing a single line of code.

---

## 🧠 ROLE & OPERATING PRINCIPLES

You are an expert senior software engineer building a **proprietary headless CMS** for an e-commerce platform called **TumiraThumela Shop**. This CMS will fully replace Sanity.io and runs entirely on a self-owned VPS.

**Your core rules:**
1. **No placeholders.** Implement full logic. No `// TODO`, no `/* ... */`.
2. **Type everything.** Use TypeScript interfaces for every data model, API response, and function signature.
3. **Security first.** Every API route must validate input, enforce auth, and sanitize output.
4. **Production-ready.** This is not a prototype. Use proper error handling, logging, and database transactions.
5. **Self-hosted mindset.** Prefer free, open-source, self-hosted tools over paid third-party services. If a service costs money, find a self-hosted alternative.
6. **Match the consuming stack.** The Next.js 15 shop uses Clerk, Zustand, Tailwind CSS 4, Radix UI, and Framer Motion.

---

## 📐 PROJECT CONTEXT

```
CMS Name            : TumiraCMS
Platform            : TumiraThumela Shop (shop.tumirathumela.com)
Replacing           : Sanity.io (Studio v3)
Auth Provider       : Clerk (@clerk/nextjs) — DO NOT replace this
Primary Language    : TypeScript (strict mode)
Package Manager     : npm
Runtime             : Node.js 20 LTS (via PM2)
Deployment          : Single VPS (all services co-located)
Reverse Proxy       : Nginx (handles routing, SSL, static file serving)
Process Manager     : PM2 (keeps Node.js apps alive)
Containerisation    : Docker Compose (PostgreSQL + Redis only)
```

---

## 🗂️ ARCHITECTURE OVERVIEW

Everything runs on a single VPS. Nginx is the only public-facing entry point.

```
                         Internet
                            │
                     ┌──────▼──────┐
                     │    Nginx    │   ← SSL termination, reverse proxy,
                     │  (port 80/443)    static media serving
                     └──┬──────┬───┘
                        │      │
           ┌────────────▼┐    ┌▼────────────────┐
           │  TumiraCMS  │    │  Static Media   │
           │  Next.js 15 │    │  /var/cms/media │  ← served by Nginx directly
           │  (PM2, 3000)│    │  (no Node.js)   │
           └──────┬───────┘    └─────────────────┘
                  │
       ┌──────────┼──────────┐
       │          │          │
  ┌────▼───┐ ┌───▼────┐ ┌───▼─────┐
  │Postgres│ │ Redis  │ │  Local  │
  │(Docker)│ │(Docker)│ │FS Media │
  │ :5432  │ │ :6379  │ │  Store  │
  └────────┘ └────────┘ └─────────┘
       │
  Consumed by
  ┌────▼────────────────────────┐
  │  shop.tumirathumela.com     │  ← Calls CMS API over HTTPS
  │  (separate Vercel deploy    │     replaces sanity/lib/client.ts
  │   OR same VPS via PM2)      │
  └─────────────────────────────┘
```

---

## 🛠️ TECH STACK — FULLY FREE & SELF-HOSTED

### CMS Backend API + Admin UI
| Concern | Tool | Cost |
|---|---|---|
| Framework | Next.js 15 (App Router, Route Handlers) | Free |
| ORM | Prisma | Free |
| Validation | Zod | Free |
| Process Manager | PM2 | Free |

### Database
| Concern | Tool | Cost |
|---|---|---|
| Primary DB | PostgreSQL 16 (Docker) | Free |
| Caching / Rate Limiting | Redis 7 (Docker) | Free |
| Search | PostgreSQL full-text search | Free |

### Media Storage
| Concern | Tool | Cost |
|---|---|---|
| Storage | Local filesystem `/var/cms/media/` | Free (VPS disk) |
| Serving | Nginx (static files, direct disk reads) | Free |
| Image processing | `sharp` (Node.js, runs on upload) | Free |
| SSL | Let's Encrypt via Certbot | Free |

### Authentication
| Concern | Tool | Cost |
|---|---|---|
| Auth | Clerk (keep existing) | Free tier |

> **Why keep Clerk?** Auth is security-critical. Clerk handles OAuth, MFA, session security, and GDPR. The cost is negligible compared to the risk of a homegrown auth system. Everything else is self-hosted.

---

## 🐳 DOCKER COMPOSE SETUP

Create `docker-compose.yml` at the project root to manage PostgreSQL and Redis:

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: tumiracms_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: tumiracms
      POSTGRES_USER: tumiracms
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/db-backup:/backups  # for automated backups
    ports:
      - "127.0.0.1:5432:5432"  # localhost only, never exposed publicly
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tumiracms"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: tumiracms_redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"  # localhost only, never exposed publicly

volumes:
  postgres_data:
  redis_data:
```

---

## 🌐 NGINX CONFIGURATION

Create `/etc/nginx/sites-available/tumiracms` on the VPS:

```nginx
# /etc/nginx/sites-available/tumiracms

# ── Media File Server (serves /var/cms/media/ directly from disk) ──
server {
    listen 443 ssl http2;
    server_name media.tumirathumela.com;

    ssl_certificate     /etc/letsencrypt/live/media.tumirathumela.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/media.tumirathumela.com/privkey.pem;

    root /var/cms/media;
    autoindex off;

    location / {
        # Aggressive caching for media — files are content-addressed (cuid in name)
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options nosniff;
        try_files $uri =404;
    }

    # Security: block everything except image/video/pdf types
    location ~* \.(php|sh|env|sql)$ {
        deny all;
    }

    client_max_body_size 50M;
}

# ── CMS Admin + API ──
server {
    listen 443 ssl http2;
    server_name cms.tumirathumela.com;

    ssl_certificate     /etc/letsencrypt/live/cms.tumirathumela.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cms.tumirathumela.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Allow large uploads (media)
    client_max_body_size 50M;
}

# ── HTTP → HTTPS redirect ──
server {
    listen 80;
    server_name cms.tumirathumela.com media.tumirathumela.com;
    return 301 https://$host$request_uri;
}
```

---

## 🗄️ DATABASE SCHEMA (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────────────

enum DocumentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum MediaType {
  IMAGE
  VIDEO
  DOCUMENT
}

// ─── CORE CONTENT MODELS ──────────────────────────────────

model Product {
  id               String         @id @default(cuid())
  slug             String         @unique
  status           DocumentStatus @default(DRAFT)
  name             String
  description      Json           // Tiptap/ProseMirror JSON
  draftContent     Json?          // Staged edits (shown only in admin)
  shortDescription String?
  price            Decimal        @db.Decimal(10, 2)
  compareAtPrice   Decimal?       @db.Decimal(10, 2)
  sku              String?        @unique
  stock            Int            @default(0)
  isActive         Boolean        @default(true)
  isFeatured       Boolean        @default(false)
  weight           Decimal?       @db.Decimal(8, 2)
  seoTitle         String?
  seoDescription   String?

  // Relations
  categoryId       String?
  category         Category?      @relation(fields: [categoryId], references: [id])
  images           ProductImage[]
  variants         ProductVariant[]
  tags             ProductTag[]
  collections      CollectionProduct[]
  revisions        ProductRevision[]

  // Timestamps + audit
  publishedAt      DateTime?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  createdBy        String         // Clerk userId
  updatedBy        String         // Clerk userId

  @@index([slug])
  @@index([status])
  @@index([categoryId])
  // Full-text search index
  @@index([name])
}

model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String
  options   Json     // [{ name: "Size", value: "XL" }, { name: "Color", value: "Red" }]
  sku       String?  @unique
  price     Decimal? @db.Decimal(10, 2)
  stock     Int      @default(0)
  imageId   String?
  image     Media?   @relation(fields: [imageId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  mediaId   String
  media     Media   @relation(fields: [mediaId], references: [id])
  altText   String?
  position  Int     @default(0)

  @@index([productId])
}

model Category {
  id             String     @id @default(cuid())
  slug           String     @unique
  name           String
  description    String?
  parentId       String?
  parent         Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children       Category[] @relation("CategoryHierarchy")
  imageId        String?
  image          Media?     @relation(fields: [imageId], references: [id])
  seoTitle       String?
  seoDescription String?
  products       Product[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
  @@index([parentId])
}

model Collection {
  id             String             @id @default(cuid())
  slug           String             @unique
  name           String
  description    Json?
  imageId        String?
  image          Media?             @relation(fields: [imageId], references: [id])
  status         DocumentStatus     @default(DRAFT)
  seoTitle       String?
  seoDescription String?
  products       CollectionProduct[]

  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
}

model CollectionProduct {
  collectionId String
  productId    String
  position     Int        @default(0)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  product      Product    @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([collectionId, productId])
}

model Tag {
  id       String       @id @default(cuid())
  name     String       @unique
  slug     String       @unique
  products ProductTag[]
}

model ProductTag {
  productId String
  tagId     String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([productId, tagId])
}

// ─── MEDIA LIBRARY ────────────────────────────────────────
// Files live at: /var/cms/media/{year}/{month}/{filename}
// Served via Nginx at: https://media.tumirathumela.com/{year}/{month}/{filename}

model Media {
  id           String      @id @default(cuid())
  filename     String      // e.g., "clx123abc.webp"
  originalName String      // original upload filename
  mimeType     String
  size         Int         // bytes
  width        Int?        // pixels (images only)
  height       Int?        // pixels (images only)
  diskPath     String      @unique  // absolute path on disk: /var/cms/media/2026/06/clx123.webp
  publicUrl    String      // https://media.tumirathumela.com/2026/06/clx123.webp
  thumbPath    String?     // /var/cms/media/2026/06/clx123_thumb.webp
  thumbUrl     String?     // https://media.tumirathumela.com/2026/06/clx123_thumb.webp
  altText      String?
  type         MediaType   @default(IMAGE)
  folderId     String?
  folder       MediaFolder? @relation(fields: [folderId], references: [id])

  // Used by
  productImages   ProductImage[]
  productVariants ProductVariant[]
  categories      Category[]
  collections     Collection[]

  uploadedBy String   // Clerk userId
  createdAt  DateTime @default(now())

  @@index([type])
  @@index([folderId])
}

model MediaFolder {
  id       String        @id @default(cuid())
  name     String
  parentId String?
  parent   MediaFolder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children MediaFolder[] @relation("FolderHierarchy")
  media    Media[]

  createdAt DateTime @default(now())
}

// ─── REVISION HISTORY ─────────────────────────────────────

model ProductRevision {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  snapshot  Json     // Full product data snapshot at time of save
  createdBy String   // Clerk userId
  createdAt DateTime @default(now())

  @@index([productId])
}

// ─── SITE SETTINGS / GLOBALS ──────────────────────────────

model SiteSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedBy String
  updatedAt DateTime @updatedAt
}

// ─── WEBHOOKS ─────────────────────────────────────────────

model Webhook {
  id        String   @id @default(cuid())
  name      String
  url       String
  secret    String
  events    String[]
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model WebhookLog {
  id         String   @id @default(cuid())
  webhookId  String
  event      String
  payload    Json
  statusCode Int?
  response   String?
  success    Boolean
  createdAt  DateTime @default(now())

  @@index([webhookId])
}
```

---

## 🔌 API DESIGN

### Base URL
```
https://cms.tumirathumela.com/api/cms/v1/
```

### Authentication
Every API route **must** validate the incoming Clerk JWT:

```typescript
// lib/cms-auth.ts
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export async function requireCmsAdmin(req: NextRequest) {
  const { userId, sessionClaims } = getAuth(req)
  if (!userId) throw new ApiError(401, 'Unauthenticated')
  const role = (sessionClaims?.publicMetadata as any)?.role
  if (role !== 'admin' && role !== 'editor') throw new ApiError(403, 'Forbidden')
  return { userId, role }
}
```

### Public Read API (used by shop.tumirathumela.com)
Read-only. Requires `X-CMS-API-Key` header. Responses cached in Redis (60s TTL):

```
GET  /api/cms/v1/products              → list published products (paginated)
GET  /api/cms/v1/products/[slug]       → single product by slug
GET  /api/cms/v1/categories            → list all categories
GET  /api/cms/v1/categories/[slug]     → single category with products
GET  /api/cms/v1/collections/[slug]    → single collection with products
GET  /api/cms/v1/search?q=             → full-text search (PostgreSQL tsvector)
GET  /api/cms/v1/settings/[key]        → global site settings
```

### Admin Write API (used by CMS Admin UI)
Protected by Clerk JWT, role must be `admin` or `editor`:

```
# Products
POST   /api/cms/v1/admin/products
GET    /api/cms/v1/admin/products/[id]
PATCH  /api/cms/v1/admin/products/[id]
DELETE /api/cms/v1/admin/products/[id]
POST   /api/cms/v1/admin/products/[id]/publish
POST   /api/cms/v1/admin/products/[id]/unpublish

# Categories
POST   /api/cms/v1/admin/categories
PATCH  /api/cms/v1/admin/categories/[id]
DELETE /api/cms/v1/admin/categories/[id]

# Collections
POST   /api/cms/v1/admin/collections
PATCH  /api/cms/v1/admin/collections/[id]
DELETE /api/cms/v1/admin/collections/[id]

# Media
POST   /api/cms/v1/admin/media/upload       → multipart/form-data
DELETE /api/cms/v1/admin/media/[id]         → delete from disk + DB
GET    /api/cms/v1/admin/media              → list media library

# Settings
PUT    /api/cms/v1/admin/settings/[key]

# Revisions
GET    /api/cms/v1/admin/products/[id]/revisions
POST   /api/cms/v1/admin/products/[id]/revisions/[revId]/restore
```

---

## 📦 STANDARD API RESPONSE FORMAT

```typescript
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "pageSize": 20, "total": 142 } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Product not found", "details": {} } }
```

---

## 🖼️ LOCAL MEDIA HANDLING

### Directory Structure on VPS
```
/var/cms/
└── media/
    ├── 2026/
    │   ├── 06/
    │   │   ├── clx123abc.webp          ← optimized image
    │   │   ├── clx123abc_thumb.webp    ← 300×300 thumbnail
    │   │   └── clx456def.pdf           ← document
    │   └── 07/
    └── 2027/
```

Nginx serves this directory directly at `https://media.tumirathumela.com/`. Node.js **never proxies media** — it only writes to disk on upload.

### Upload Flow
```typescript
// lib/media-storage.ts

import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { cuid } from '@paralleldrive/cuid2'

const MEDIA_ROOT = process.env.MEDIA_ROOT! // e.g., /var/cms/media
const MEDIA_URL  = process.env.MEDIA_URL!  // e.g., https://media.tumirathumela.com

export async function saveMediaFile(file: File): Promise<SavedMedia> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const id = cuid()
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const dir = path.join(MEDIA_ROOT, year, month)

  await mkdir(dir, { recursive: true })

  if (file.type.startsWith('image/')) {
    // Convert to WebP + create thumbnail
    const filename = `${id}.webp`
    const thumbname = `${id}_thumb.webp`

    const metadata = await sharp(buffer).metadata()

    await sharp(buffer)
      .webp({ quality: 85 })
      .toFile(path.join(dir, filename))

    await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(path.join(dir, thumbname))

    return {
      filename,
      diskPath: path.join(dir, filename),
      publicUrl: `${MEDIA_URL}/${year}/${month}/${filename}`,
      thumbPath: path.join(dir, thumbname),
      thumbUrl: `${MEDIA_URL}/${year}/${month}/${thumbname}`,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      mimeType: 'image/webp',
      type: 'IMAGE',
    }
  } else {
    // Non-image: store as-is
    const ext = file.name.split('.').pop() ?? 'bin'
    const filename = `${id}.${ext}`
    await writeFile(path.join(dir, filename), buffer)

    return {
      filename,
      diskPath: path.join(dir, filename),
      publicUrl: `${MEDIA_URL}/${year}/${month}/${filename}`,
      thumbPath: null,
      thumbUrl: null,
      width: null,
      height: null,
      mimeType: file.type,
      type: file.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT',
    }
  }
}

export async function deleteMediaFile(diskPath: string, thumbPath: string | null) {
  const { unlink } = await import('fs/promises')
  await unlink(diskPath).catch(() => {}) // ignore if already deleted
  if (thumbPath) await unlink(thumbPath).catch(() => {})
}
```

### Delete Flow
When `DELETE /api/cms/v1/admin/media/[id]` is called:
1. Load `Media` record from DB
2. Call `deleteMediaFile(media.diskPath, media.thumbPath)`
3. Delete `Media` row from PostgreSQL
4. Return `204 No Content`

---

## ⚡ REDIS CACHING

Use Redis (self-hosted via Docker) for:
1. **Public API response caching** — 60 second TTL
2. **Rate limiting** — sliding window per IP

```typescript
// lib/redis.ts
import { Redis } from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
```

```typescript
// lib/cache.ts
import { redis } from './redis'

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as T

  const result = await fn()
  await redis.setex(key, ttlSeconds, JSON.stringify(result))
  return result
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}

// Usage: invalidate all product cache after publish
// invalidateCache('cms:products:*')
```

### Rate Limiting (no Upstash needed — uses local Redis)
```typescript
// lib/rate-limit.ts
import { redis } from './redis'

export async function rateLimit(ip: string, limit: number, windowSeconds: number) {
  const key = `ratelimit:${ip}:${Math.floor(Date.now() / (windowSeconds * 1000))}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSeconds)
  if (count > limit) throw new ApiError(429, 'Too many requests')
}
```

---

## ✍️ RICH TEXT EDITOR

Use **Tiptap** with the following extensions:
- `StarterKit` (bold, italic, headings, lists, blockquote, code)
- `Link` with `autolink: true`
- `Image` (insert from Media Library, not direct upload)
- `Placeholder`
- `CharacterCount`

Store as **Tiptap JSON** in a Prisma `Json` column.

Provide a `renderRichText(json: JSONContent): string` server utility that converts Tiptap JSON to HTML for Next.js SSR.

---

## 🔄 DRAFT / PUBLISH WORKFLOW

```
DRAFT → (publish) → PUBLISHED
PUBLISHED → (unpublish) → DRAFT
DRAFT | PUBLISHED → (archive) → ARCHIVED
```

**Rules:**
- Public API only returns `PUBLISHED` documents
- Each save of a published document creates a `ProductRevision` snapshot first
- `draftContent` field holds staged edits for a published document (separate from live content)
- On publish, `draftContent` is merged into the main fields and cleared
- Editors can restore any revision (replaces current content, keeps status)

---

## 🪝 WEBHOOKS (Cache Revalidation)

```typescript
// Webhook payload
{
  "event": "product.published",
  "timestamp": "2026-06-11T05:00:00Z",
  "data": { "id": "clx...", "slug": "mens-casual-shirt", "type": "product" }
}
```

- Sign with `HMAC-SHA256`, header: `X-CMS-Signature: sha256=<hex>`
- Retry up to 3× with exponential backoff using `setTimeout` (no external queue needed)
- Log every attempt to `WebhookLog`
- Target: Next.js shop's `/api/revalidate` route which calls `revalidatePath()`

---

## 🖥️ CMS ADMIN UI PAGES

### Layout
- Collapsible left sidebar with navigation
- Top bar: Clerk user avatar, breadcrumbs, quick-save indicator
- Main content area with max-width container

### Pages
```
/                           → Dashboard (products count, drafts, disk usage, recent activity)
/products                   → Product list (TanStack Table, filter by status/category)
/products/new               → Create product
/products/[id]              → Edit product (full form)
/products/[id]/revisions    → Revision timeline with restore
/categories                 → Category tree (drag-to-reorder)
/collections                → Collection list
/collections/[id]           → Collection editor (drag products to reorder)
/media                      → Media library (grid, folder tree, react-dropzone upload zone)
/settings                   → Global site settings editor
/settings/webhooks          → Webhook management
```

### Product Form Fields
```
- Name (text)
- Slug (auto-generated, editable, live uniqueness check)
- Category (searchable select)
- Tags (multi-select with inline create)
- Short Description (textarea, 160 char limit)
- Description (Tiptap rich text editor)
- Price (decimal input)
- Compare At Price (decimal, optional)
- SKU (text, optional)
- Stock (number)
- Weight (grams)
- Images (drag-to-reorder, Media Library picker)
- Variants (repeatable: name + options + SKU + price + stock + image)
- Is Featured (toggle)
- SEO Title (text, 60 char counter)
- SEO Description (textarea, 160 char counter)
- Status badge + Publish/Unpublish/Archive button
```

---

## 💾 BACKUP STRATEGY

Create `scripts/backup.sh` — run via cron daily:

```bash
#!/bin/bash
# /var/cms/scripts/backup.sh

BACKUP_DIR="/var/cms/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# 1. PostgreSQL dump
docker exec tumiracms_postgres pg_dump -U tumiracms tumiracms \
  | gzip > "$BACKUP_DIR/db.sql.gz"

# 2. Media files (incremental rsync to backup location)
rsync -av --link-dest="/var/cms/backups/latest/media" \
  /var/cms/media/ "$BACKUP_DIR/media/"

# Update "latest" symlink
ln -sfn "$BACKUP_DIR" /var/cms/backups/latest

# 3. Keep only last 14 days
find /var/cms/backups -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +

echo "Backup complete: $BACKUP_DIR"
```

Add to crontab: `0 2 * * * /var/cms/scripts/backup.sh >> /var/log/cms-backup.log 2>&1`

---

## 🔒 SECURITY REQUIREMENTS

- [ ] All admin routes validate Clerk JWT — no exceptions
- [ ] All public routes validate `X-CMS-API-Key` header
- [ ] All inputs validated with Zod before any DB query
- [ ] Slug uniqueness enforced at DB level (unique index) + API level (409 Conflict)
- [ ] File uploads: validate MIME type server-side (not just extension), max 50MB
- [ ] SQL injection: impossible via Prisma (parameterized queries only)
- [ ] CORS: restrict Admin UI API to `cms.tumirathumela.com` and `shop.tumirathumela.com` only
- [ ] Rate limiting via local Redis (no Upstash): 100 req/min public, 500 req/min admin
- [ ] Webhook signatures: always verify HMAC before processing
- [ ] Nginx: PostgreSQL (5432) and Redis (6379) bound to `127.0.0.1` only — never public
- [ ] Media directory: Nginx blocks `.php`, `.sh`, `.env`, `.sql` extensions
- [ ] No sensitive data in logs

---

## 📊 PERFORMANCE REQUIREMENTS

- Public API cached in Redis (60s TTL), invalidated on publish/unpublish
- Admin API: never cached, always fresh
- PostgreSQL indexes: `slug`, `status`, `categoryId`, `createdAt`
- Pagination: all list endpoints support `?page=1&pageSize=20`
- Full-text search: PostgreSQL `to_tsvector('english', name || ' ' || description::text)`
- Media served by Nginx with `Cache-Control: immutable` (1 year) — filenames are content-addressed
- PM2 cluster mode: `instances: 'max'` to use all VPS CPU cores

---

## 📁 RECOMMENDED FOLDER STRUCTURE

```
tumiracms/
├── app/
│   ├── (admin)/                    ← Clerk-protected admin UI
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx            ← Product list
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx        ← Edit form
│   │   │       └── revisions/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── collections/
│   │   ├── media/page.tsx
│   │   └── settings/
│   └── api/
│       └── cms/
│           └── v1/
│               ├── products/route.ts
│               ├── products/[slug]/route.ts
│               ├── categories/route.ts
│               ├── collections/[slug]/route.ts
│               ├── search/route.ts
│               ├── settings/[key]/route.ts
│               └── admin/
│                   ├── products/route.ts
│                   ├── products/[id]/route.ts
│                   ├── products/[id]/publish/route.ts
│                   ├── products/[id]/revisions/route.ts
│                   ├── media/route.ts
│                   ├── media/upload/route.ts
│                   └── settings/[key]/route.ts
├── components/
│   ├── editor/                     ← Tiptap rich text editor
│   ├── media/                      ← Media library picker modal
│   ├── products/                   ← Form, list, revision viewer
│   ├── ui/                         ← Radix UI base components
│   └── layout/                     ← Sidebar, topbar, breadcrumbs
├── lib/
│   ├── prisma.ts                   ← Prisma singleton
│   ├── redis.ts                    ← Redis (ioredis) singleton
│   ├── cache.ts                    ← withCache + invalidateCache
│   ├── rate-limit.ts               ← Redis sliding window rate limiter
│   ├── media-storage.ts            ← Local disk upload/delete with sharp
│   ├── auth.ts                     ← Clerk JWT helpers
│   ├── webhooks.ts                 ← Fire + HMAC sign + retry
│   ├── rich-text.ts                ← Tiptap JSON → HTML
│   └── api-response.ts             ← Standard response builders
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── scripts/
│   ├── migrate-from-sanity.ts      ← Sanity → PostgreSQL migration
│   └── backup.sh                   ← Daily DB + media backup
├── types/
│   └── cms.ts                      ← All TypeScript interfaces
├── docker-compose.yml
├── ecosystem.config.js             ← PM2 config
└── middleware.ts                   ← Clerk auth middleware
```

### PM2 Config
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tumiracms',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 'max',         // use all CPU cores
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 },
    error_file: '/var/log/cms/error.log',
    out_file: '/var/log/cms/out.log',
    log_rotate_interval: '1d',
    max_memory_restart: '1G', // restart if memory exceeds 1GB
  }]
}
```

---

## 🔁 MIGRATION FROM SANITY

### Step 1: Export Sanity Data
```bash
npx sanity dataset export production ./sanity-export.tar.gz --no-drafts
```

### Step 2: Run Migration Script
Build `scripts/migrate-from-sanity.ts` that:
1. Reads NDJSON from Sanity export
2. Maps Sanity fields → Prisma schema
3. **Downloads Sanity CDN assets → saves to local `/var/cms/media/` via `saveMediaFile()`**
4. Seeds PostgreSQL via Prisma

```typescript
// Field mappings:
// product._id             → Product.id (cuid())
// product.slug.current    → Product.slug
// product.title           → Product.name
// product.description[]   → Product.description (Portable Text → Tiptap JSON)
// product.price           → Product.price
// product.images[].asset  → download from Sanity CDN → saveMediaFile() → Media + ProductImage
// product.categories[0]   → Product.categoryId
```

**Portable Text → Tiptap JSON:** use `@portabletext/to-html` then `@tiptap/html`'s `generateJSON`.

### Step 3: Replace Sanity Client in Next.js Shop

```typescript
// lib/cms-client.ts (replaces sanity/lib/client.ts)
const CMS_BASE = process.env.CMS_API_URL!   // https://cms.tumirathumela.com
const CMS_KEY  = process.env.CMS_API_KEY!

async function cmsGet<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${CMS_BASE}${path}`, {
    headers: { 'X-CMS-API-Key': CMS_KEY },
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`CMS fetch failed: ${res.status} ${path}`)
  const json = await res.json()
  return json.data as T
}

export const cmsClient = {
  getProducts: ()           => cmsGet<Product[]>('/api/cms/v1/products'),
  getProduct: (slug: string)=> cmsGet<Product>(`/api/cms/v1/products/${slug}`),
  getCategories: ()         => cmsGet<Category[]>('/api/cms/v1/categories'),
  getCategory: (slug: string)=> cmsGet<Category>(`/api/cms/v1/categories/${slug}`),
  getCollection: (slug: string)=> cmsGet<Collection>(`/api/cms/v1/collections/${slug}`),
  search: (q: string)       => cmsGet<Product[]>(`/api/cms/v1/search?q=${encodeURIComponent(q)}`),
  getSettings: (key: string)=> cmsGet<SiteSettings>(`/api/cms/v1/settings/${key}`),
}
```

---

## 🌍 ENVIRONMENT VARIABLES

```env
# ── Database ──────────────────────────────────────────────
DATABASE_URL=postgresql://tumiracms:YOUR_POSTGRES_PASSWORD@127.0.0.1:5432/tumiracms
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD

# ── Redis ─────────────────────────────────────────────────
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# ── Media (local disk) ────────────────────────────────────
MEDIA_ROOT=/var/cms/media
MEDIA_URL=https://media.tumirathumela.com

# ── CMS API ───────────────────────────────────────────────
CMS_API_KEY=YOUR_RANDOM_SECRET_KEY_FOR_SHOP_TO_CALL_CMS
CMS_API_URL=https://cms.tumirathumela.com

# ── Clerk (keep existing) ─────────────────────────────────
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

---

## ✅ DELIVERABLES CHECKLIST

The AI must produce all of the following before considering the build complete:

- [ ] `docker-compose.yml` — PostgreSQL + Redis
- [ ] `prisma/schema.prisma` — complete schema
- [ ] `prisma/migrations/` — migration files
- [ ] `prisma/seed.ts` — sample products, categories, media records
- [ ] All public API route handlers with Redis caching
- [ ] All admin API route handlers
- [ ] Zod validation schemas for every input
- [ ] Clerk JWT middleware + `requireCmsAdmin` helper
- [ ] `lib/media-storage.ts` — local disk upload/delete with `sharp`
- [ ] `lib/redis.ts` + `lib/cache.ts` + `lib/rate-limit.ts`
- [ ] Nginx config for `cms.` and `media.` subdomains
- [ ] `ecosystem.config.js` — PM2 cluster config
- [ ] Tiptap editor component
- [ ] Media library UI (grid + folders + react-dropzone)
- [ ] Product create/edit form (all fields)
- [ ] Category tree UI with drag-to-reorder
- [ ] Collection editor with draggable products
- [ ] Revision history UI + restore
- [ ] Webhook management UI + HMAC signing + retry logic
- [ ] Dashboard with live stats (disk usage from `fs.statfs`, product counts from DB)
- [ ] `scripts/migrate-from-sanity.ts`
- [ ] `scripts/backup.sh` + cron instructions
- [ ] `lib/cms-client.ts` — drop-in for `sanity/lib/client.ts`
- [ ] `README.md` — VPS setup guide (Docker, Nginx, PM2, Certbot, cron)
- [ ] `.env.example` — all variables documented

---

*TumiraCMS Spec v1.1 — Fully Self-Hosted VPS Edition | Built for shop.tumirathumela.com | Do not share externally*
