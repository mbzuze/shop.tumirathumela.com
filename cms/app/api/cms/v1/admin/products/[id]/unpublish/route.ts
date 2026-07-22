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
    if (existing.status !== 'PUBLISHED') return errorResponse('CONFLICT', 'Product is not published', 409)

    const product = await prisma.product.update({
      where: { id },
      data: { status: 'DRAFT', updatedBy: userId },
    })

    await invalidateCache(CacheKeys.product(product.slug))
    await invalidateCache('cms:products:*')
    await fireWebhooks('product.unpublished', { id: product.id, slug: product.slug, type: 'product' })

    return successResponse({ id: product.id, status: product.status })
  } catch (err) {
    return handleApiError(err)
  }
}
