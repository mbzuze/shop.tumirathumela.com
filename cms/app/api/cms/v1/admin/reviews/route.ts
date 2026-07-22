import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, handleApiError, paginationParams } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const { page, pageSize, skip } = paginationParams(req.nextUrl.searchParams)
    const approved = req.nextUrl.searchParams.get('approved')
    const productId = req.nextUrl.searchParams.get('productId') ?? undefined

    const where = {
      ...(approved === 'true' ? { isApproved: true } : approved === 'false' ? { isApproved: false } : {}),
      ...(productId ? { productId } : {}),
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.review.count({ where }),
    ])

    return successResponse(
      reviews.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    )
  } catch (err) {
    return handleApiError(err)
  }
}
