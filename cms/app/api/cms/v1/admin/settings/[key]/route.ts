import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { invalidateCache, CacheKeys } from '@/lib/cache'

type Params = { params: Promise<{ key: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireCmsAdmin()
    const { key } = await params
    const body = await req.json()

    const setting = await prisma.siteSettings.upsert({
      where: { key },
      update: { value: body.value, updatedBy: userId },
      create: { key, value: body.value, updatedBy: userId },
    })

    await invalidateCache(CacheKeys.settings(key))
    return successResponse({
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updatedAt.toISOString(),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
