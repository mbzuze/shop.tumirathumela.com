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

    const locale = (req.nextUrl.searchParams.get('locale') ?? 'ZA').toUpperCase() as 'ZA' | 'ZW'
    const cacheKey = CacheKeys.homepageSections(locale)

    const sections = await withCache(cacheKey, 60, async () => {
      const rows = await prisma.homepageSection.findMany({
        where: {
          isActive: true,
          locale: { in: [locale, 'BOTH'] },
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            include: { media: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
      return rows.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))
    })

    return successResponse(sections)
  } catch (err) {
    return handleApiError(err)
  }
}
