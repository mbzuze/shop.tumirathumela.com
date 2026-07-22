import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, CacheKeys } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)

    const categories = await withCache(CacheKeys.categories(), 60, async () => {
      const cats = await prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: 'asc' },
        include: {
          image: true,
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              image: true,
              _count: { select: { products: { where: { status: 'PUBLISHED', isActive: true } } } },
            },
          },
          _count: { select: { products: { where: { status: 'PUBLISHED', isActive: true } } } },
        },
      })
      return cats.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        children: c.children.map((ch) => ({
          ...ch,
          createdAt: ch.createdAt.toISOString(),
          updatedAt: ch.updatedAt.toISOString(),
        })),
      }))
    })

    return successResponse(categories)
  } catch (err) {
    return handleApiError(err)
  }
}
