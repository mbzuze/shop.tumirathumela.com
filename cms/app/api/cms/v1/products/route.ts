import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withCache, CacheKeys } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth'
import { successResponse, handleApiError, paginationParams } from '@/lib/api-response'
import { getReservedQuantities } from '@/lib/inventory'

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: {
    include: { media: true },
    orderBy: { position: 'asc' as const },
    take: 1,
  },
  variants: { include: { image: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.ProductInclude

export async function GET(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)

    const { searchParams } = req.nextUrl

    // Server-side checkout repricing: given a set of ids, return exactly
    // those published products with trusted current prices. Deliberately
    // bypasses withCache — this is the pricing-authoritative path, and
    // CacheKeys.products() has no slot for an id set; caching it would
    // either collide with the paginated cache or let checkout charge a
    // stale price for up to the 60s TTL after an edit (product mutations
    // only invalidate the slug-keyed cache entries, never an id-keyed one).
    const idsParam = searchParams.get('ids')
    if (idsParam) {
      const ids = [...new Set(idsParam.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 100)
      if (ids.length === 0) return successResponse([])

      const products = await prisma.product.findMany({
        where: { id: { in: ids }, status: 'PUBLISHED', isActive: true },
        include: PRODUCT_INCLUDE,
      })
      const reserved = await getReservedQuantities(products.map((p) => p.id))
      return successResponse(withAvailableStock(products.map(serializeProduct), reserved))
    }

    const { page, pageSize, skip } = paginationParams(searchParams)
    const category = searchParams.get('category') ?? undefined
    const featured = searchParams.get('featured')
    const bestSellers = searchParams.get('bestSellers')
    const deals = searchParams.get('deals')

    const cacheKey = CacheKeys.products(page, pageSize, category, `f${featured ?? ''}b${bestSellers ?? ''}d${deals ?? ''}`)

    const result = await withCache(cacheKey, 60, async () => {
      const where = {
        status: 'PUBLISHED' as const,
        isActive: true,
        ...(category ? { category: { slug: category } } : {}),
        ...(featured === 'true' ? { isFeatured: true } : {}),
        ...(bestSellers === 'true' ? { isBestSeller: true } : {}),
        ...(deals === 'true' ? { dealBadge: { not: null } } : {}),
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: deals === 'true' ? { dealPercent: 'desc' } : { publishedAt: 'desc' },
          include: PRODUCT_INCLUDE,
        }),
        prisma.product.count({ where }),
      ])

      return {
        products: products.map(serializeProduct),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    })

    // Reservation subtraction happens here, after the cache lookup, not
    // inside withCache's callback: the expensive relational product query
    // stays cached at 60s, but "is this still available" is a
    // numerically-sensitive, time-of-request value and must always be
    // fresh — caching it would let the storefront show stock that's
    // already fully reserved by someone else's in-flight order.
    const reserved = await getReservedQuantities(result.products.map((p) => p.id))
    return successResponse(withAvailableStock(result.products, reserved), {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>

// Applied post-serialization, never inside serializeProduct itself, so the
// same function works whether its caller cached the underlying product
// query or not — only the reservation subtraction needs to always be
// fresh. Admin-facing routes never call this; they show the raw physical
// Product.stock column, since that's what an admin actually manages.
function withAvailableStock<T extends { id: string; stock: number }>(
  products: T[],
  reserved: Map<string, number>
): T[] {
  return products.map((p) => ({
    ...p,
    stock: Math.max(0, p.stock - (reserved.get(p.id) ?? 0)),
  }))
}

function serializeProduct(p: ProductWithRelations) {
  return {
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    weight: p.weight ? Number(p.weight) : null,
    rating: p.rating ? Number(p.rating) : null,
    tags: p.tags.map((pt) => pt.tag),
    images: p.images.map((pi) => ({
      ...pi,
      media: pi.media,
    })),
    variants: p.variants.map((v) => ({
      ...v,
      price: v.price ? Number(v.price) : null,
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }
}
