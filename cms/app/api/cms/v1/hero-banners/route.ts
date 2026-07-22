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

    const banners = await withCache(CacheKeys.heroBanners(), 60, async () => {
      const rows = await prisma.heroBanner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { media: true },
      })
      return rows.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    })

    return successResponse(banners)
  } catch (err) {
    return handleApiError(err)
  }
}
