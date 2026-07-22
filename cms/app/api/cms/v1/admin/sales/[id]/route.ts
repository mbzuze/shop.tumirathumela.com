import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { UpdateSaleSchema } from '@/lib/zod-schemas'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateSaleSchema.parse(body)

    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.sale.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.couponCode ? { couponCode: data.couponCode } : {}),
          ...(data.discountType !== undefined ? { discountType: data.discountType } : {}),
          ...(data.discountValue !== undefined ? { discountValue: data.discountValue } : {}),
          ...(data.minimumOrderValue !== undefined ? { minimumOrderValue: data.minimumOrderValue } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.startsAt !== undefined ? { startsAt: data.startsAt ? new Date(data.startsAt) : null } : {}),
          ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.usageLimit !== undefined ? { usageLimit: data.usageLimit } : {}),
        },
      })
      if (data.productIds !== undefined) {
        await tx.saleProduct.deleteMany({ where: { saleId: id } })
        if (data.productIds.length > 0) {
          await tx.saleProduct.createMany({
            data: data.productIds.map((productId) => ({ saleId: id, productId })),
          })
        }
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
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const sale = await prisma.sale.findUnique({ where: { id } })
    if (!sale) return errorResponse('NOT_FOUND', 'Sale not found', 404)
    await prisma.sale.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
