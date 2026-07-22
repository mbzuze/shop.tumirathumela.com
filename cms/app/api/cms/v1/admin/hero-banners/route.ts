import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { CreateHeroBannerSchema } from '@/lib/zod-schemas'
import { createId } from '@paralleldrive/cuid2'
import { invalidateCache, CacheKeys } from '@/lib/cache'

export async function GET(_: NextRequest) {
  try {
    await requireCmsAdmin()
    const banners = await prisma.heroBanner.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { media: { select: { id: true, publicUrl: true, thumbUrl: true, altText: true } } },
    })
    return NextResponse.json(successResponse(banners))
  } catch (e) { return handleApiError(e) }
}

export async function POST(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const body = await req.json()
    const data = CreateHeroBannerSchema.parse(body)
    const banner = await prisma.heroBanner.create({
      data: {
        id: createId(),
        title: data.title,
        subtitle: data.subtitle ?? null,
        ctaText: data.ctaText ?? null,
        ctaUrl: data.ctaUrl ?? null,
        overlayOpacity: data.overlayOpacity ?? 40,
        textColor: data.textColor ?? '#ffffff',
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        mediaId: data.mediaId ?? null,
      },
    })
    await invalidateCache(CacheKeys.heroBanners())
    return NextResponse.json(successResponse(banner), { status: 201 })
  } catch (e) { return handleApiError(e) }
}
