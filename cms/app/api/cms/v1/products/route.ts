import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withCache, CacheKeys } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth'
import { successResponse, handleApiError, paginationParams } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)

    const { searchParams } = req.nextUrl
    const { page, pageSize, skip } = paginationParams(searchParams)
    const category = searchParams.get('category') ?? undefined
    const featured = searchParams.get('featured')
    const bestSellers = searchParams.get('bestSellers')

    const cacheKey = CacheKeys.products(page, pageSize, category)

    const result = await withCache(cacheKey, 60, async () => {
      const where = {
        status: 'PUBLISHED' as const,
        isActive: true,
        ...(category ? { category: { slug: category } } : {}),
        ...(featured === 'true' ? { isFeatured: true } : {}),
        ...(bestSellers === 'true' ? { isBestSeller: true } : {}),
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { publishedAt: 'desc' },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            brand: { select: { id: true, name: true, slug: true } },
            images: {
              include: { media: true },
              orderBy: { position: 'asc' },
              take: 1,
            },
            variants: { include: { image: true } },
            tags: { include: { tag: true } },
          },
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

    return successResponse(result.products, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } }
    brand: { select: { id: true; name: true; slug: true } }
    images: { include: { media: true }; orderBy: { position: 'asc' }; take: 1 }
    variants: { include: { image: true } }
    tags: { include: { tag: true } }
  }
}>

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
