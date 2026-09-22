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

    const fieldUpdates = {
      ...(data.status ? { status: data.status } : {}),
      ...(data.notes ? { notes: data.notes } : {}),
      ...(data.checkoutId ? { checkoutId: data.checkoutId } : {}),
      ...(data.paymentId ? { paymentId: data.paymentId } : {}),
    }

    // Reversing a completed order back to CANCELLED/REFUNDED — restore the
    // stock and coupon usage that were committed when it was paid. Admin-
    // triggered only (a human clicking a status change), so a plain
    // existing-status check is proportionate here; it isn't exposed to a
    // concurrent external caller the way the COMPLETED path below is.
    const reversingPaid =
      existing.status === 'COMPLETED' &&
      (data.status === 'CANCELLED' || data.status === 'REFUNDED')

    const order = await prisma.$transaction(async (tx) => {
      let becomingPaid = false

      if (data.status === 'COMPLETED') {
        // Atomic conditional transition, guarded on status rather than
        // paidAt: an order can legitimately be COMPLETED, reversed to
        // CANCELLED (which restores stock/usage but never clears paidAt —
        // it's kept as "when this order was originally paid"), and then
        // completed again. Gating on paidAt alone would treat that second
        // completion as a no-op and silently skip re-decrementing stock.
        // Gating on status also closes the race between the Yoco webhook
        // and a concurrent admin action reaching the same order at once —
        // a plain read-then-write outside the transaction can't guarantee
        // that the way this conditional update can.
        const result = await tx.order.updateMany({
          where: { id, status: { not: 'COMPLETED' } },
          data: { ...fieldUpdates, paidAt: new Date() },
        })
        becomingPaid = result.count === 1
        if (!becomingPaid) {
          // Already COMPLETED, or lost the race — still apply any other
          // fields (checkoutId/paymentId/notes) without re-touching paidAt.
          await tx.order.updateMany({ where: { id }, data: fieldUpdates })
        }
      } else {
        await tx.order.updateMany({ where: { id }, data: fieldUpdates })
      }

      if (becomingPaid || reversingPaid) {
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true, quantity: true },
        })
        // Decrement on payment, restore on a later cancel/refund. No floor
        // at zero: this is a plain atomic increment, not a full stock
        // reservation, so a genuine concurrent oversell (two people paying
        // for the last unit within the same window) surfaces as a visibly
        // negative count rather than being silently hidden.
        const sign = becomingPaid ? -1 : 1
        for (const item of items) {
          if (!item.productId) continue // no product link — nothing to adjust
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: sign * item.quantity } },
          })
        }

        if (existing.couponCode) {
          const sale = await tx.sale.findFirst({
            where: { couponCode: { equals: existing.couponCode, mode: 'insensitive' } },
          })
          if (sale) {
            await tx.sale.update({
              where: { id: sale.id },
              data: { usageCount: { increment: becomingPaid ? 1 : -1 } },
            })
          }
        }
      }

      return tx.order.findUniqueOrThrow({ where: { id } })
    })

    // Only a real status transition is webhook-worthy — attaching a gateway
    // id (checkoutId at order creation, paymentId from the payment webhook)
    // must not itself fan out a spurious order.updated to every subscriber.
    if (data.status) {
      await fireWebhooks('order.updated', { id: order.id, orderNumber: order.orderNumber, status: order.status })
    }

    return successResponse({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      checkoutId: order.checkoutId,
      paymentId: order.paymentId,
      updatedAt: order.updatedAt.toISOString(),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
