import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { invalidateCache, CacheKeys } from '@/lib/cache'
import { z } from 'zod'

export async function PATCH(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(await req.json())
    await prisma.$transaction(
      ids.map((id, i) => prisma.heroBanner.update({ where: { id }, data: { sortOrder: i } }))
    )
    await invalidateCache(CacheKeys.heroBanners())
    return NextResponse.json(successResponse({ reordered: true }))
  } catch (e) { return handleApiError(e) }
}
