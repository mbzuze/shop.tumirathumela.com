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

    const brands = await withCache(CacheKeys.brands(), 120, async () => {
      const rows = await prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          logo: true,
          _count: { select: { products: { where: { status: 'PUBLISHED', isActive: true } } } },
        },
      })
      return rows.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    })

    return successResponse(brands)
  } catch (err) {
    return handleApiError(err)
  }
}
