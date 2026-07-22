import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { UpdateReviewSchema } from '@/lib/zod-schemas'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateReviewSchema.parse(body)

    const review = await prisma.review.update({
      where: { id },
      data,
    })

    // Recalculate product rating if approval status changed
    if (data.isApproved !== undefined) {
      const stats = await prisma.review.aggregate({
        where: { productId: review.productId, isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      })
      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: stats._avg.rating ?? null,
          reviewCount: stats._count.id,
        },
      })
    }

    return successResponse({ ...review, createdAt: review.createdAt.toISOString(), updatedAt: review.updatedAt.toISOString() })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) return errorResponse('NOT_FOUND', 'Review not found', 404)
    await prisma.review.delete({ where: { id } })
    if (review.productId) {
      const stats = await prisma.review.aggregate({
        where: { productId: review.productId, isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      })
      await prisma.product.update({
        where: { id: review.productId },
        data: { rating: stats._avg.rating ?? null, reviewCount: stats._count.id },
      })
    }
    return new Response(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
