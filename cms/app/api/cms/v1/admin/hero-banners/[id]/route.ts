import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { invalidateCache, CacheKeys } from '@/lib/cache'
import { z } from 'zod'

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
  ctaText: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  overlayOpacity: z.number().min(0).max(100).optional(),
  textColor: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  mediaId: z.string().nullable().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateSchema.parse(body)
    const banner = await prisma.heroBanner.update({
      where: { id },
      data: {
        ...data,
        startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : undefined,
        endsAt: data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : undefined,
      },
    })
    await invalidateCache(CacheKeys.heroBanners())
    return NextResponse.json(successResponse(banner))
  } catch (e) { return handleApiError(e) }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const banner = await prisma.heroBanner.findUnique({ where: { id } })
    if (!banner) throw new ApiError(404, 'NOT_FOUND', 'Banner not found')
    await prisma.heroBanner.delete({ where: { id } })
    await invalidateCache(CacheKeys.heroBanners())
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (e) { return handleApiError(e) }
}
