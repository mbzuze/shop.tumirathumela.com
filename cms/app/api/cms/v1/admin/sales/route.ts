import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { CreateSaleSchema } from '@/lib/zod-schemas'

export async function GET(_req: NextRequest) {
  try {
    await requireCmsAdmin()
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: { products: { include: { product: { select: { id: true, name: true, slug: true } } } } },
    })
    return successResponse(sales.map((s) => ({
      ...s,
      discountValue: Number(s.discountValue),
      minimumOrderValue: s.minimumOrderValue ? Number(s.minimumOrderValue) : null,
      startsAt: s.startsAt?.toISOString() ?? null,
      endsAt: s.endsAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      products: s.products.map((sp) => sp.product),
    })))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const body = await req.json()
    const data = CreateSaleSchema.parse(body)

    const existing = await prisma.sale.findUnique({ where: { couponCode: data.couponCode } })
    if (existing) return errorResponse('CONFLICT', 'Coupon code already exists', 409)

    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.sale.create({
        data: {
          name: data.name,
          couponCode: data.couponCode,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minimumOrderValue: data.minimumOrderValue,
          description: data.description,
          startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
          endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
          isActive: data.isActive ?? true,
          usageLimit: data.usageLimit,
        },
      })
      if (data.productIds?.length) {
        await tx.saleProduct.createMany({
          data: data.productIds.map((productId) => ({ saleId: s.id, productId })),
        })
      }
      return s
    })

    return successResponse({
      ...sale,
      discountValue: Number(sale.discountValue),
      minimumOrderValue: sale.minimumOrderValue ? Number(sale.minimumOrderValue) : null,
      startsAt: sale.startsAt?.toISOString() ?? null,
      endsAt: sale.endsAt?.toISOString() ?? null,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
    }, undefined, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
