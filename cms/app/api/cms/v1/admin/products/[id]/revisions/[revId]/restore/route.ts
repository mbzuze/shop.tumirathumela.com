import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { invalidateCache, CacheKeys } from '@/lib/cache'

type Params = { params: Promise<{ id: string; revId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireCmsAdmin()
    const { id, revId } = await params

    const revision = await prisma.productRevision.findFirst({
      where: { id: revId, productId: id },
    })
    if (!revision) return errorResponse('NOT_FOUND', 'Revision not found', 404)

    const snapshot = revision.snapshot as Record<string, unknown>

    const product = await prisma.$transaction(async (tx) => {
      // Save current state as a new revision before restoring
      const current = await tx.product.findUniqueOrThrow({ where: { id } })
      await tx.productRevision.create({
        data: {
          productId: id,
          snapshot: { ...current, price: Number(current.price) } as object,
          createdBy: userId,
        },
      })

      return tx.product.update({
        where: { id },
        data: {
          name: snapshot.name as string,
          slug: snapshot.slug as string,
          description: snapshot.description as object,
          shortDescription: snapshot.shortDescription as string | undefined,
          price: snapshot.price as number,
          compareAtPrice: snapshot.compareAtPrice as number | undefined,
          sku: snapshot.sku as string | undefined,
          stock: snapshot.stock as number,
          seoTitle: snapshot.seoTitle as string | undefined,
          seoDescription: snapshot.seoDescription as string | undefined,
          updatedBy: userId,
        },
      })
    })

    await invalidateCache(CacheKeys.product(product.slug))

    return successResponse({ id: product.id, restoredFrom: revId })
  } catch (err) {
    return handleApiError(err)
  }
}
