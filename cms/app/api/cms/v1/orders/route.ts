import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'
import { fireWebhooks } from '@/lib/webhooks'

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
  shippingAddress: z.record(z.unknown()),
})

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

    return NextResponse.json(successResponse({
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
    }))
  } catch (e) { return handleApiError(e) }
}

export async function POST(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const body = await req.json()
    const data = CreateOrderSchema.parse(body)

    const existing = await prisma.order.findUnique({ where: { orderNumber: data.orderNumber } })
    if (existing) throw new ApiError(409, 'DUPLICATE_ORDER', 'Order number already exists')

    const order = await prisma.$transaction(async (tx) => {
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
    })

    fireWebhooks('order.created', { orderId: order.id, orderNumber: order.orderNumber }).catch(() => {})
    return NextResponse.json(successResponse({
      ...order,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      orderDate: order.orderDate.toISOString(),
    }), { status: 201 })
  } catch (e) { return handleApiError(e) }
}
