import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { CreateHomepageSectionSchema } from '@/lib/zod-schemas'
import { createId } from '@paralleldrive/cuid2'
import { invalidateCache, CacheKeys } from '@/lib/cache'

export async function GET(_: NextRequest) {
  try {
    await requireCmsAdmin()
    const sections = await prisma.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })
    return NextResponse.json(successResponse(sections))
  } catch (e) { return handleApiError(e) }
}

export async function POST(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const body = await req.json()
    const data = CreateHomepageSectionSchema.parse(body)

    const section = await prisma.$transaction(async (tx) => {
      const sec = await tx.homepageSection.create({
        data: {
          id: createId(),
          title: data.title,
          variant: data.variant as 'FEATURED_PRODUCTS' | 'COLLECTION_GRID' | 'BANNER_ROW' | 'PROMO_TILES' | 'TESTIMONIALS' | 'BRANDS' | 'TEXT_BANNER',
          locale: (data.locale ?? 'BOTH') as 'ZA' | 'ZW' | 'BOTH',
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
        },
      })
      if (data.items?.length) {
        await tx.homepageSectionItem.createMany({
          data: data.items.map((item, i) => ({
            id: createId(),
            sectionId: sec.id,
            title: item.title ?? null,
            subtitle: item.subtitle ?? null,
            linkUrl: item.linkUrl ?? null,
            linkText: item.linkText ?? null,
            sortOrder: item.sortOrder ?? i,
            referenceId: item.referenceId ?? null,
            referenceType: item.referenceType ?? null,
            mediaId: item.mediaId ?? null,
          })),
        })
      }
      return sec
    })

    await invalidateCache('cms:homepage:*')
    return NextResponse.json(successResponse(section), { status: 201 })
  } catch (e) { return handleApiError(e) }
}
