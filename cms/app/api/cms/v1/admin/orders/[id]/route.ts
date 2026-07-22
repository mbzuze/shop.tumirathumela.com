import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin, requireCmsAdminOrApiKey } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { UpdateOrderStatusSchema } from '@/lib/zod-schemas'
import { fireWebhooks } from '@/lib/webhooks'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, name: true, slug: true } } } },
      },
    })
    if (!order) return errorResponse('NOT_FOUND', 'Order not found', 404)

    return successResponse({
      ...order,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      orderDate: order.orderDate.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdminOrApiKey(req)
    const { id } = await params
    const body = await req.json()
    const data = UpdateOrderStatusSchema.parse(body)

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) return errorResponse('NOT_FOUND', 'Order not found', 404)

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.notes ? { notes: data.notes } : {}),
        ...(data.status === 'COMPLETED' && !existing.paidAt ? { paidAt: new Date() } : {}),
      },
    })

    await fireWebhooks('order.updated', { id: order.id, orderNumber: order.orderNumber, status: order.status })

    return successResponse({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      updatedAt: order.updatedAt.toISOString(),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
