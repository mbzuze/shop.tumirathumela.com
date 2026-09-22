import { NextRequest } from 'next/server'
import { Prisma, type Order } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'
import { fireWebhooks } from '@/lib/webhooks'
import { ShippingAddressSchema } from '@/lib/zod-schemas'
import { checkAndReserveStock } from '@/lib/inventory'

const CreateOrderSchema = z.object({
  orderNumber: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  clerkUserId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().optional(),
    name: z.string(),
    sku: z.string().optional(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    image: z.string().optional(),
  })),
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().optional(),
  shippingCost: z.number().nonnegative().optional(),
  total: z.number().positive(),
  currency: z.string().length(3).optional(),
  paymentProvider: z.enum(['YOCO', 'PAYFAST']),
  paymentId: z.string().optional(),
  couponCode: z.string().optional(),
  shippingAddress: ShippingAddressSchema,
  // Client-generated, one per distinct checkout attempt. See the schema
  // comment on Order.idempotencyKey for the guarantee this provides.
  idempotencyKey: z.string().min(1).max(200).optional(),
})

function serializeOrder(order: Order) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    orderDate: order.orderDate.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  }
}

export async function GET(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) throw new ApiError(400, 'MISSING_PARAM', 'userId is required')

    const orders = await prisma.order.findMany({
      where: { clerkUserId: userId },
      orderBy: { orderDate: 'desc' },
      include: { items: true },
    })

    return successResponse({
      orders: orders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount),
        shippingCost: Number(o.shippingCost),
        total: Number(o.total),
        orderDate: o.orderDate.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        items: o.items.map((i) => ({ ...i, price: Number(i.price) })),
      })),
    })
  } catch (e) { return handleApiError(e) }
}

function isIdempotencyKeyConflict(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002' &&
    (err.meta?.target as string[] | undefined)?.includes('idempotencyKey') === true
  )
}

function isDeadlock(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') return true
  // Defensive backstop: Prisma's deadlock-code mapping isn't confirmed
  // airtight on every code path. Postgres's own error message for a
  // detected deadlock (SQLSTATE 40P01) is literally "deadlock detected" —
  // check for that directly rather than guessing at an internal error shape.
  return err instanceof Error && err.message.toLowerCase().includes('deadlock detected')
}

export async function POST(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const body = await req.json()
    const data = CreateOrderSchema.parse(body)

    // Fast path: a prior request with this exact key already succeeded.
    // Return that order rather than erroring or creating a duplicate — this
    // is what makes a retried or double-submitted checkout return the same
    // order instead of two.
    if (data.idempotencyKey) {
      const existingByKey = await prisma.order.findUnique({ where: { idempotencyKey: data.idempotencyKey } })
      if (existingByKey) {
        return successResponse(serializeOrder(existingByKey), undefined, 200)
      }
    }

    const existing = await prisma.order.findUnique({ where: { orderNumber: data.orderNumber } })
    if (existing) throw new ApiError(409, 'DUPLICATE_ORDER', 'Order number already exists')

    const createOrderRow = () => prisma.$transaction(async (tx) => {
      // The actual oversell-proof guarantee — locks the involved product
      // rows and throws INSUFFICIENT_STOCK before anything is created if
      // there isn't enough available. See lib/inventory.ts for why.
      await checkAndReserveStock(tx, data.items)

      const o = await tx.order.create({
        data: {
          id: createId(),
          orderNumber: data.orderNumber,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          customerPhone: data.customerPhone ?? null,
          clerkUserId: data.clerkUserId,
          status: 'PENDING',
          subtotal: data.subtotal,
          discountAmount: data.discountAmount ?? 0,
          shippingCost: data.shippingCost ?? 0,
          total: data.total,
          currency: data.currency ?? 'ZAR',
          paymentProvider: data.paymentProvider,
          paymentId: data.paymentId ?? null,
          couponCode: data.couponCode ?? null,
          shippingAddress: data.shippingAddress as Prisma.InputJsonValue,
          idempotencyKey: data.idempotencyKey ?? null,
          orderDate: new Date(),
        },
      })
      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          id: createId(),
          orderId: o.id,
          productId: item.productId ?? null,
          name: item.name,
          sku: item.sku ?? null,
          quantity: item.quantity,
          price: item.price,
          image: item.image ?? null,
        })),
      })
      return o
    }, {
      // Under contention on one scarce SKU, this can legitimately spend
      // real time blocked on the FOR UPDATE lock inside checkAndReserveStock
      // — longer than Prisma's 5s default timeout would allow before
      // surfacing an opaque timeout error instead of a clean
      // INSUFFICIENT_STOCK response.
      timeout: 10_000,
      maxWait: 5_000,
    })

    // checkAndReserveStock's sorted per-product locking closes deadlocks
    // *within* this path, but a different code path (the admin order PATCH
    // route's stock adjustment on a COMPLETED/reversal transition) also
    // takes multi-row Product locks and doesn't share this ordering. Treat
    // a deadlock as an expected, retryable condition rather than assuming
    // ordering alone eliminates it.
    async function createOrderRowWithRetry(attemptsLeft = 3): Promise<Order> {
      try {
        return await createOrderRow()
      } catch (err) {
        if (attemptsLeft > 1 && isDeadlock(err)) {
          return createOrderRowWithRetry(attemptsLeft - 1)
        }
        throw err
      }
    }

    let order: Order
    let isNew = true
    try {
      order = await createOrderRowWithRetry()
    } catch (err) {
      // A concurrent request with the same idempotencyKey won the race to
      // insert first. The unique constraint is the actual guarantee here —
      // this fast path above is just the common case. Return the winner's
      // order rather than erroring.
      if (data.idempotencyKey && isIdempotencyKeyConflict(err)) {
        const winner = await prisma.order.findUnique({ where: { idempotencyKey: data.idempotencyKey } })
        if (winner) {
          order = winner
          isNew = false
        } else {
          throw err
        }
      } else {
        throw err
      }
    }

    if (isNew) {
      fireWebhooks('order.created', { orderId: order.id, orderNumber: order.orderNumber }).catch(() => {})
    }
    return successResponse(serializeOrder(order), undefined, isNew ? 201 : 200)
  } catch (e) { return handleApiError(e) }
}
