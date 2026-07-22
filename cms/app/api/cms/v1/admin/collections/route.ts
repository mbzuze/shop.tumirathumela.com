import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { CreateCollectionSchema } from '@/lib/zod-schemas'
import { createId } from '@paralleldrive/cuid2'

export async function GET(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    })
    return NextResponse.json(successResponse(collections))
  } catch (e) { return handleApiError(e) }
}

export async function POST(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const body = await req.json()
    const data = CreateCollectionSchema.parse(body)

    const collection = await prisma.$transaction(async (tx) => {
      const col = await tx.collection.create({
        data: {
          id: createId(),
          name: data.name,
          slug: data.slug,
          description: (data.description as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
          status: data.publish ? 'PUBLISHED' : 'DRAFT',
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
        },
      })
      if (data.productIds?.length) {
        await tx.collectionProduct.createMany({
          data: data.productIds.map((pid, i) => ({
            collectionId: col.id,
            productId: pid,
            position: i,
          })),
        })
      }
      return col
    })

    return NextResponse.json(successResponse(collection), { status: 201 })
  } catch (e) { return handleApiError(e) }
}
