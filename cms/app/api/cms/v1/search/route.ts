import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, CacheKeys } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError, paginationParams } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)

    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) return errorResponse('BAD_REQUEST', 'Query must be at least 2 characters', 400)

    const { page, pageSize, skip } = paginationParams(req.nextUrl.searchParams)
    const cacheKey = `${CacheKeys.search(q)}:${page}:${pageSize}`

    const result = await withCache(cacheKey, 30, async () => {
      const where = {
        status: 'PUBLISHED' as const,
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { shortDescription: { contains: q, mode: 'insensitive' as const } },
          { sku: { contains: q, mode: 'insensitive' as const } },
          { brand: { name: { contains: q, mode: 'insensitive' as const } } },
          { category: { name: { contains: q, mode: 'insensitive' as const } } },
          { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' as const } } } } },
        ],
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
          include: {
            images: { include: { media: true }, orderBy: { position: 'asc' }, take: 1 },
            brand: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
            tags: { include: { tag: true } },
          },
        }),
        prisma.product.count({ where }),
      ])

      return {
        products: products.map((p) => ({
          ...p,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          rating: p.rating ? Number(p.rating) : null,
          tags: p.tags.map((pt) => pt.tag),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          publishedAt: p.publishedAt?.toISOString() ?? null,
        })),
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
