import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { invalidateCache, CacheKeys } from '@/lib/cache'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'

const ItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  linkText: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  referenceId: z.string().nullable().optional(),
  referenceType: z.string().nullable().optional(),
  mediaId: z.string().nullable().optional(),
})

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  variant: z.string().optional(),
  locale: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  items: z.array(ItemSchema).optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateSchema.parse(body)

    const section = await prisma.$transaction(async (tx) => {
      const sec = await tx.homepageSection.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.variant !== undefined && { variant: data.variant as 'FEATURED_PRODUCTS' }),
          ...(data.locale !== undefined && { locale: data.locale as 'ZA' }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        },
      })

      if (data.items !== undefined) {
        await tx.homepageSectionItem.deleteMany({ where: { sectionId: id } })
        if (data.items.length) {
          await tx.homepageSectionItem.createMany({
            data: data.items.map((item, i) => ({
              id: item.id ?? createId(),
              sectionId: id,
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
      }
      return sec
    })

    await invalidateCache('cms:homepage:*')
    return NextResponse.json(successResponse(section))
  } catch (e) { return handleApiError(e) }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const sec = await prisma.homepageSection.findUnique({ where: { id } })
    if (!sec) throw new ApiError(404, 'NOT_FOUND', 'Section not found')
    await prisma.homepageSection.delete({ where: { id } })
    await invalidateCache('cms:homepage:*')
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (e) { return handleApiError(e) }
}
