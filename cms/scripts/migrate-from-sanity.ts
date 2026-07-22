#!/usr/bin/env tsx
/**
 * Migrates data from a Sanity NDJSON export to TumiraCMS PostgreSQL,
 * downloading referenced Sanity CDN image assets into local media storage.
 *
 * Usage:
 *   npx tsx scripts/migrate-from-sanity.ts --input=export.ndjson --project=<sanityProjectId> --dataset=production [--dry-run]
 *
 * Generate the export from Sanity Studio:
 *   npx @sanity/export --types product,category,brand,review,order,heroBanner,homepageSection,siteSettings --output export.ndjson
 *
 * Requires the same MEDIA_ROOT / MEDIA_URL env vars as the running app (see .env.example).
 */

import fs from 'fs'
import { mkdir } from 'fs/promises'
import path from 'path'
import readline from 'readline'
import sharp from 'sharp'
import { PrismaClient, Prisma } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'
import { generateJSON } from '@tiptap/html'
import { StarterKit } from '@tiptap/starter-kit'
import { toHTML } from '@portabletext/to-html'

const prisma = new PrismaClient()
const args = process.argv.slice(2)
const inputArg = args.find((a) => a.startsWith('--input='))
const projectArg = args.find((a) => a.startsWith('--project='))
const datasetArg = args.find((a) => a.startsWith('--dataset='))
const dryRun = args.includes('--dry-run')

if (!inputArg) {
  console.error('Usage: tsx scripts/migrate-from-sanity.ts --input=export.ndjson --project=<id> --dataset=production [--dry-run]')
  process.exit(1)
}

const inputFile = inputArg.split('=')[1]
if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`)
  process.exit(1)
}

const SANITY_PROJECT = projectArg?.split('=')[1] ?? process.env.SANITY_PROJECT_ID
const SANITY_DATASET = datasetArg?.split('=')[1] ?? process.env.SANITY_DATASET ?? 'production'
const MEDIA_ROOT = process.env.MEDIA_ROOT ?? require('path').join(process.cwd(), 'public', 'media')
const MEDIA_URL = process.env.MEDIA_URL ?? 'https://admin.tumirathumela.com/media'
const MIGRATION_USER = 'sanity-migration'

type SanityDoc = Record<string, unknown>

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function sanitySlug(doc: SanityDoc): string {
  const slug = doc.slug as { current?: string } | string | undefined
  if (typeof slug === 'object' && slug?.current) return slug.current
  if (typeof slug === 'string') return slug
  return slugify(String(doc.title ?? doc.name ?? doc._id))
}

function sanityRef(ref: unknown): string | null {
  if (typeof ref === 'object' && ref !== null && '_ref' in ref) return (ref as { _ref: string })._ref
  return null
}

/** Portable Text (or a plain string) -> Tiptap JSON, matching lib/rich-text.ts's expected shape. */
function toTiptapJson(description: unknown): Prisma.InputJsonValue {
  if (!description) {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
  if (typeof description === 'string') {
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }] }
  }
  if (Array.isArray(description)) {
    try {
      const html = toHTML(description as never)
      return generateJSON(html, [StarterKit]) as Prisma.InputJsonValue
    } catch {
      return { type: 'doc', content: [{ type: 'paragraph' }] }
    }
  }
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

/** Resolves a Sanity image asset ref (image-<id>-<w>x<h>-<ext>) to its CDN URL. */
function sanityAssetUrl(assetRef: string): string | null {
  if (!SANITY_PROJECT) return null
  const match = assetRef.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/)
  if (!match) return null
  const [, id, dimensions, ext] = match
  return `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}/${id}-${dimensions}.${ext}`
}

const mediaCache = new Map<string, string>() // sanity asset ref -> Media.id

/** Downloads a Sanity CDN image and saves it into local media storage + a Media row, mirroring lib/media-storage.ts. */
async function downloadAndSaveImage(assetRef: string, altText?: string): Promise<string | null> {
  if (mediaCache.has(assetRef)) return mediaCache.get(assetRef)!
  const url = sanityAssetUrl(assetRef)
  if (!url) return null

  if (dryRun) {
    console.log(`  [DRY RUN] would download ${url}`)
    return null
  }

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())

    const id = createId()
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const dir = path.join(MEDIA_ROOT, year, month)
    await mkdir(dir, { recursive: true })

    const filename = `${id}.webp`
    const thumbname = `${id}_thumb.webp`
    const filePath = path.join(dir, filename)
    const thumbPath = path.join(dir, thumbname)

    const metadata = await sharp(buffer).metadata()
    await sharp(buffer).webp({ quality: 85 }).toFile(filePath)
    await sharp(buffer).resize(300, 300, { fit: 'cover' }).webp({ quality: 80 }).toFile(thumbPath)
    const stat = await fs.promises.stat(filePath)

    const media = await prisma.media.create({
      data: {
        id: createId(),
        filename,
        originalName: `${assetRef}.${url.split('.').pop()}`,
        mimeType: 'image/webp',
        size: stat.size,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        diskPath: filePath,
        publicUrl: `${MEDIA_URL}/${year}/${month}/${filename}`,
        thumbPath,
        thumbUrl: `${MEDIA_URL}/${year}/${month}/${thumbname}`,
        altText: altText ?? null,
        type: 'IMAGE',
        uploadedBy: MIGRATION_USER,
      },
    })
    mediaCache.set(assetRef, media.id)
    return media.id
  } catch (err) {
    console.warn(`  Failed to download image ${assetRef}: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

async function migrate() {
  const lines: string[] = []
  const rl = readline.createInterface({ input: fs.createReadStream(inputFile), crlfDelay: Infinity })
  for await (const line of rl) {
    if (line.trim()) lines.push(line)
  }

  const docs: SanityDoc[] = lines.map((l) => JSON.parse(l))
  const byType = new Map<string, SanityDoc[]>()
  for (const doc of docs) {
    const type = String(doc._type)
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type)!.push(doc)
  }

  const idMap = new Map<string, string>()
  const getId = (sanityId: string) => {
    if (!idMap.has(sanityId)) idMap.set(sanityId, createId())
    return idMap.get(sanityId)!
  }

  const log = (msg: string) => console.log(dryRun ? `[DRY RUN] ${msg}` : msg)

  if (!SANITY_PROJECT) {
    console.warn('No --project provided (or SANITY_PROJECT_ID env var) — image assets will be skipped.')
  }

  // 1 — Categories
  const categories = byType.get('category') ?? []
  log(`Migrating ${categories.length} categories...`)
  for (const doc of categories) {
    const id = getId(String(doc._id))
    const data = {
      id,
      name: String(doc.title ?? doc.name),
      slug: sanitySlug(doc),
      description: (doc.description as string) ?? null,
      isActive: (doc.isActive as boolean) ?? true,
      sortOrder: (doc.order as number) ?? 0,
    }
    if (!dryRun) {
      await prisma.category.upsert({ where: { slug: data.slug }, update: data, create: data })
    }
  }
  for (const doc of categories) {
    const parentRef = sanityRef(doc.parent)
    if (parentRef && !dryRun) {
      const childId = idMap.get(String(doc._id))
      const parentId = idMap.get(parentRef)
      if (childId && parentId) {
        await prisma.category.update({ where: { id: childId }, data: { parentId } }).catch(() => {})
      }
    }
  }

  // 2 — Brands
  const brands = byType.get('brand') ?? []
  log(`Migrating ${brands.length} brands...`)
  for (const doc of brands) {
    const id = getId(String(doc._id))
    const data = {
      id,
      name: String(doc.name ?? doc.title),
      slug: sanitySlug(doc),
      description: (doc.description as string) ?? null,
      website: (doc.website as string) ?? null,
      isActive: (doc.isActive as boolean) ?? true,
    }
    if (!dryRun) {
      await prisma.brand.upsert({ where: { slug: data.slug }, update: data, create: data })
    }
  }

  // 3 — Products (+ image assets)
  const products = byType.get('product') ?? []
  log(`Migrating ${products.length} products...`)
  for (const doc of products) {
    const id = getId(String(doc._id))
    const categoryRef = sanityRef(doc.category) ?? sanityRef((doc.categories as unknown[])?.[0])
    const brandRef = sanityRef(doc.brand)
    const slug = sanitySlug(doc)
    const data = {
      id,
      name: String(doc.title ?? doc.name),
      slug,
      description: toTiptapJson(doc.description),
      sku: (doc.sku as string) ?? null,
      shortDescription: (doc.shortDescription as string) ?? null,
      price: Number(doc.price ?? 0),
      compareAtPrice: doc.compareAtPrice ? Number(doc.compareAtPrice) : null,
      status: (doc.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') ?? 'DRAFT',
      isFeatured: (doc.isFeatured as boolean) ?? false,
      isBestSeller: (doc.isBestSeller as boolean) ?? false,
      categoryId: categoryRef ? (idMap.get(categoryRef) ?? null) : null,
      brandId: brandRef ? (idMap.get(brandRef) ?? null) : null,
      stock: Number(doc.stock ?? doc.stockQuantity ?? 0),
      rating: doc.rating ?? doc.averageRating ? Number(doc.rating ?? doc.averageRating) : null,
      reviewCount: Number(doc.reviewCount ?? 0),
      seoTitle: (doc.seoTitle as string) ?? null,
      seoDescription: (doc.seoDescription as string) ?? null,
      createdBy: MIGRATION_USER,
      updatedBy: MIGRATION_USER,
    }
    if (!dryRun) {
      await prisma.product.upsert({ where: { slug: data.slug }, update: data, create: data })
    }

    // Images: doc.images: [{ asset: { _ref } }, ...]
    const images = (doc.images as Array<{ asset?: unknown; alt?: string }> | undefined) ?? []
    for (let i = 0; i < images.length; i++) {
      const assetRef = sanityRef(images[i].asset)
      if (!assetRef) continue
      const mediaId = await downloadAndSaveImage(assetRef, images[i].alt)
      if (mediaId && !dryRun) {
        const existing = await prisma.productImage.findFirst({ where: { productId: id, mediaId } })
        if (!existing) {
          await prisma.productImage.create({
            data: { productId: id, mediaId, altText: images[i].alt ?? null, position: i },
          })
        }
      }
    }
  }

  // 4 — Reviews
  const reviews = byType.get('review') ?? []
  log(`Migrating ${reviews.length} reviews...`)
  for (const doc of reviews) {
    const id = getId(String(doc._id))
    const productRef = sanityRef(doc.product)
    if (!productRef) continue
    const productId = idMap.get(productRef)
    if (!productId) continue
    const data = {
      id,
      productId,
      clerkUserId: String(doc.userId ?? doc.clerkUserId ?? 'migrated'),
      authorName: String(doc.authorName ?? doc.name ?? 'Anonymous'),
      rating: Number(doc.rating ?? 5),
      title: (doc.title as string) ?? null,
      body: String(doc.body ?? doc.text ?? ''),
      isApproved: (doc.isApproved as boolean) ?? false,
      isVerifiedPurchase: (doc.isVerifiedPurchase as boolean) ?? false,
      helpfulVotes: Number(doc.helpfulVotes ?? 0),
    }
    if (!dryRun) {
      await prisma.review.upsert({ where: { id }, update: data, create: data })
    }
  }

  // 5 — Orders (+ line items)
  const orders = byType.get('order') ?? []
  log(`Migrating ${orders.length} orders...`)
  for (const doc of orders) {
    const id = getId(String(doc._id))
    const shippingAddr = (doc.shippingAddress ?? doc.deliveryAddress ?? {}) as Record<string, string>
    const orderNumber = String(doc.orderNumber ?? String(doc._id).slice(-8).toUpperCase())
    const data = {
      id,
      orderNumber,
      clerkUserId: String(doc.userId ?? doc.clerkUserId ?? 'migrated'),
      customerEmail: String(doc.customerEmail ?? doc.email ?? ''),
      customerName: String(doc.customerName ?? doc.name ?? ''),
      customerPhone: (doc.customerPhone as string) ?? null,
      status: (doc.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED') ?? 'PENDING',
      subtotal: Number(doc.subtotal ?? doc.total ?? 0),
      discountAmount: Number(doc.discountAmount ?? 0),
      shippingCost: Number(doc.shippingCost ?? doc.shipping ?? 0),
      total: Number(doc.total ?? 0),
      currency: String(doc.currency ?? 'ZAR'),
      paymentProvider: (doc.paymentProvider as 'YOCO' | 'PAYFAST' | 'MANUAL') ?? 'YOCO',
      paymentId: (doc.paymentId as string) ?? null,
      couponCode: (doc.couponCode as string) ?? null,
      shippingAddress: shippingAddr as Prisma.InputJsonValue,
      orderDate: doc._createdAt ? new Date(String(doc._createdAt)) : new Date(),
    }
    if (!dryRun) {
      await prisma.order.upsert({ where: { orderNumber }, update: data, create: data })

      const items = (doc.items as Array<Record<string, unknown>> | undefined) ?? []
      if (items.length) {
        await prisma.orderItem.deleteMany({ where: { orderId: id } })
        await prisma.orderItem.createMany({
          data: items.map((item) => ({
            orderId: id,
            productId: sanityRef(item.product) ? (idMap.get(sanityRef(item.product)!) ?? null) : null,
            name: String(item.name ?? ''),
            sku: (item.sku as string) ?? null,
            price: Number(item.price ?? 0),
            quantity: Number(item.quantity ?? 1),
            image: (item.image as string) ?? null,
          })),
        })
      }
    }
  }

  // 6 — Site settings
  const settings = byType.get('siteSettings') ?? byType.get('settings') ?? []
  log(`Migrating ${settings.length} site setting docs...`)
  for (const doc of settings) {
    const entries = Object.entries(doc).filter(([k]) => !k.startsWith('_'))
    for (const [key, value] of entries) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const data = { key: `site.${key}`, value: String(value), updatedBy: MIGRATION_USER }
        if (!dryRun) {
          await prisma.siteSettings.upsert({ where: { key: data.key }, update: data, create: { id: createId(), ...data } })
        }
      }
    }
  }

  console.log('\n=== Migration Summary ===')
  console.log(`Categories: ${categories.length}`)
  console.log(`Brands:     ${brands.length}`)
  console.log(`Products:   ${products.length}`)
  console.log(`Reviews:    ${reviews.length}`)
  console.log(`Orders:     ${orders.length}`)
  console.log(`Images downloaded: ${mediaCache.size}`)
  if (dryRun) console.log('\nDRY RUN — no data was written.')
  else console.log('\nMigration complete!')
}

migrate()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
