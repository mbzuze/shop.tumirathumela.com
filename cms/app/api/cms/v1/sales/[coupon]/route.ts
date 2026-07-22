import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

export async function GET(req: NextRequest, { params }: { params: Promise<{ coupon: string }> }) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { coupon } = await params
    const now = new Date()

    const sale = await prisma.sale.findFirst({
      where: {
        couponCode: { equals: coupon.toUpperCase(), mode: 'insensitive' },
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: {
        products: {
          include: { product: { select: { id: true, name: true, slug: true } } },
        },
      },
    })

    if (!sale) return errorResponse('NOT_FOUND', 'Coupon not found or expired', 404)
    if (sale.usageLimit !== null && sale.usageCount >= sale.usageLimit) {
      return errorResponse('COUPON_EXHAUSTED', 'Coupon usage limit reached', 409)
    }

    return successResponse({
      id: sale.id,
      name: sale.name,
      couponCode: sale.couponCode,
      discountType: sale.discountType,
      discountValue: Number(sale.discountValue),
      minimumOrderValue: sale.minimumOrderValue ? Number(sale.minimumOrderValue) : null,
      description: sale.description,
      endsAt: sale.endsAt?.toISOString() ?? null,
      applicableProductIds: sale.products.map((sp) => sp.productId),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
