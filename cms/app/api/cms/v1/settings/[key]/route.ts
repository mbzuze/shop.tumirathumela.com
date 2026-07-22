import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, CacheKeys } from '@/lib/cache'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { key } = await params

    const setting = await withCache(CacheKeys.settings(key), 300, async () => {
      return prisma.siteSettings.findUnique({ where: { key } })
    })

    if (!setting) return errorResponse('NOT_FOUND', `Setting '${key}' not found`, 404)
    return successResponse({ key: setting.key, value: setting.value })
  } catch (err) {
    return handleApiError(err)
  }
}
