import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin, requireCmsAdminOrApiKey } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { UpdateOrderStatusSchema } from '@/lib/zod-schemas'
import { fireWebhooks } from '@/lib/webhooks'
import { RESERVATION_TTL_MINUTES } from '@/lib/inventory'

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
        const items = (
          await tx.orderItem.findMany({
            where: { orderId: id },
            select: { productId: true, quantity: true, product: { select: { stock: true } } },
          })
        ).sort((a, b) => (a.productId ?? '').localeCompare(b.productId ?? ''))
        // Sorted by productId — this loop, and checkAndReserveStock's
        // per-product locking in the order-creation path, now both take
        // multi-row Product locks. Keeping them in the same order avoids
        // the two paths deadlocking against each other.
        const sign = becomingPaid ? -1 : 1
        // Reservations (see lib/inventory.ts) make an oversell from two
        // people completing payment for the same unit impossible under
        // normal operation — the order-creation lock is what prevents it,
        // not this decrement. The one gap that remains: this specific
        // order's own reservation can lapse (past RESERVATION_TTL_MINUTES)
        // while its payment is still genuinely in flight, and someone else
        // legitimately buys the freed-up unit before this one's payment
        // lands. The order still completes either way — the customer paid,
        // that's not reversible — this just makes that specific case
        // visible instead of letting it blend into ordinary negative-stock
        // noise (which, under this model, would otherwise indicate an
        // actual bug rather than an accepted, narrow timing edge case).
        const reservationLapsed =
          becomingPaid && existing.orderDate < new Date(Date.now() - RESERVATION_TTL_MINUTES * 60_000)
        let wentNegative = false
        for (const item of items) {
          if (!item.productId) continue // no product link — nothing to adjust
          if (becomingPaid && item.product && item.product.stock < item.quantity) {
            wentNegative = true
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: sign * item.quantity } },
          })
        }
        if (reservationLapsed && wentNegative) {
          console.error(
            '[orders] paid after its own reservation lapsed and oversold — verify stock manually:',
            { orderId: id, orderNumber: existing.orderNumber }
          )
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
