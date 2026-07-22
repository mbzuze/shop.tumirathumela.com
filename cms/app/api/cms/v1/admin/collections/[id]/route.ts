import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { UpdateCollectionSchema } from '@/lib/zod-schemas'
import { createId } from '@paralleldrive/cuid2'
import { invalidateCache, CacheKeys } from '@/lib/cache'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        products: { include: { product: { select: { id: true, name: true, slug: true, status: true, images: { take: 1, select: { media: { select: { publicUrl: true, thumbUrl: true } } } } } } }, orderBy: { position: 'asc' } },
      },
    })
    if (!collection) throw new ApiError(404, 'NOT_FOUND', 'Collection not found')
    return NextResponse.json(successResponse(collection))
  } catch (e) { return handleApiError(e) }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateCollectionSchema.parse(body)

    const collection = await prisma.$transaction(async (tx) => {
      const col = await tx.collection.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description as Prisma.InputJsonValue }),
          ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
          ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
          ...(data.publish !== undefined && { status: data.publish ? 'PUBLISHED' : 'DRAFT' }),
        },
      })

      if (data.productIds !== undefined) {
        await tx.collectionProduct.deleteMany({ where: { collectionId: id } })
        if (data.productIds.length) {
          await tx.collectionProduct.createMany({
            data: data.productIds.map((pid, i) => ({
              collectionId: id,
              productId: pid,
              position: i,
            })),
          })
        }
      }
      return col
    })

    await invalidateCache(CacheKeys.collection(collection.slug))
    return NextResponse.json(successResponse(collection))
  } catch (e) { return handleApiError(e) }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const col = await prisma.collection.findUnique({ where: { id } })
    if (!col) throw new ApiError(404, 'NOT_FOUND', 'Collection not found')
    await prisma.collection.delete({ where: { id } })
    await invalidateCache(CacheKeys.collection(col.slug))
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (e) { return handleApiError(e) }
}
