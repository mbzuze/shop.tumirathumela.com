import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { fireWebhooks } from '@/lib/webhooks'
import { invalidateCache, CacheKeys } from '@/lib/cache'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireCmsAdmin()
    const { id } = await params

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('NOT_FOUND', 'Product not found', 404)
    if (existing.status === 'PUBLISHED') return errorResponse('CONFLICT', 'Product is already published', 409)

    const product = await prisma.$transaction(async (tx) => {
      // Snapshot before publish
      await tx.productRevision.create({
        data: {
          productId: id,
          snapshot: { ...existing, price: Number(existing.price) } as object,
          createdBy: userId,
        },
      })

      let updateData: Record<string, unknown> = {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedBy: userId,
      }

      // If there's draft content, merge it into live fields
      if (existing.draftContent) {
        const draft = existing.draftContent as Record<string, unknown>
        updateData = { ...updateData, ...draft, draftContent: null }
      }

      return tx.product.update({ where: { id }, data: updateData })
    })

    await invalidateCache(CacheKeys.product(product.slug))
    await invalidateCache('cms:products:*')
    await fireWebhooks('product.published', { id: product.id, slug: product.slug, type: 'product' })

    return successResponse({ id: product.id, status: product.status, publishedAt: product.publishedAt?.toISOString() })
  } catch (err) {
    return handleApiError(err)
  }
}
