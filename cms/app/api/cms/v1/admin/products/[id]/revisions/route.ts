import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCmsAdmin()
    const { id } = await params

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return errorResponse('NOT_FOUND', 'Product not found', 404)

    const revisions = await prisma.productRevision.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return successResponse(
      revisions.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))
    )
  } catch (err) {
    return handleApiError(err)
  }
}
