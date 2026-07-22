import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, CacheKeys } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError, paginationParams } from '@/lib/api-response'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { slug } = await params
    const { page, pageSize, skip } = paginationParams(req.nextUrl.searchParams)

    const cacheKey = `${CacheKeys.category(slug)}:${page}:${pageSize}`

    const result = await withCache(cacheKey, 60, async () => {
      const category = await prisma.category.findUnique({
        where: { slug, isActive: true },
        include: {
          image: true,
          parent: { select: { id: true, name: true, slug: true } },
          children: {
            where: { isActive: true },
            include: { image: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
      if (!category) return null

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: { categoryId: category.id, status: 'PUBLISHED', isActive: true },
          skip,
          take: pageSize,
          orderBy: { publishedAt: 'desc' },
          include: {
            images: { include: { media: true }, orderBy: { position: 'asc' }, take: 1 },
            brand: { select: { id: true, name: true, slug: true } },
            tags: { include: { tag: true } },
          },
        }),
        prisma.product.count({
          where: { categoryId: category.id, status: 'PUBLISHED', isActive: true },
        }),
      ])

      return {
        category: { ...category, createdAt: category.createdAt.toISOString(), updatedAt: category.updatedAt.toISOString() },
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

    if (!result) return errorResponse('NOT_FOUND', 'Category not found', 404)
    return successResponse(result, { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages })
  } catch (err) {
    return handleApiError(err)
  }
}
