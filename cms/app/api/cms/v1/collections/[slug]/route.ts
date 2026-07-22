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

    const collection = await withCache(CacheKeys.collection(slug), 60, async () => {
      const c = await prisma.collection.findFirst({
        where: { slug, status: 'PUBLISHED' },
        include: {
          image: true,
          products: {
            orderBy: { position: 'asc' },
            include: {
              product: {
                include: {
                  images: { include: { media: true }, orderBy: { position: 'asc' }, take: 1 },
                  brand: { select: { id: true, name: true, slug: true } },
                  category: { select: { id: true, name: true, slug: true } },
                  tags: { include: { tag: true } },
                },
              },
            },
          },
        },
      })
      if (!c) return null
      return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        publishedAt: c.publishedAt?.toISOString() ?? null,
        products: c.products.map((cp) => ({
          position: cp.position,
          product: {
            ...cp.product,
            price: Number(cp.product.price),
            compareAtPrice: cp.product.compareAtPrice ? Number(cp.product.compareAtPrice) : null,
            rating: cp.product.rating ? Number(cp.product.rating) : null,
            tags: cp.product.tags.map((pt) => pt.tag),
            createdAt: cp.product.createdAt.toISOString(),
            updatedAt: cp.product.updatedAt.toISOString(),
            publishedAt: cp.product.publishedAt?.toISOString() ?? null,
          },
        })),
      }
    })

    if (!collection) return errorResponse('NOT_FOUND', 'Collection not found', 404)
    return successResponse(collection)
  } catch (err) {
    return handleApiError(err)
  }
}
