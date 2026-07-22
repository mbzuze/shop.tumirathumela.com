import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, CacheKeys } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { slug } = await params

    const product = await withCache(CacheKeys.product(slug), 60, async () => {
      const p = await prisma.product.findFirst({
        where: { slug, status: 'PUBLISHED', isActive: true },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: {
            include: { media: true },
            orderBy: { position: 'asc' },
          },
          variants: { include: { image: true } },
          tags: { include: { tag: true } },
          reviews: {
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })
      if (!p) return null
      return {
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        weight: p.weight ? Number(p.weight) : null,
        rating: p.rating ? Number(p.rating) : null,
        tags: p.tags.map((pt) => pt.tag),
        variants: p.variants.map((v) => ({ ...v, price: v.price ? Number(v.price) : null })),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        publishedAt: p.publishedAt?.toISOString() ?? null,
      }
    })

    if (!product) return errorResponse('NOT_FOUND', 'Product not found', 404)
    return successResponse(product)
  } catch (err) {
    return handleApiError(err)
  }
}
